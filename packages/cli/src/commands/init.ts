import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import type { AirailsConfig } from "../utils/config.js";
import { getConfigDir } from "../utils/config.js";
import { getRepoFullName } from "../utils/git.js";
import { success, warn, info, spinner } from "../utils/ui.js";
import { GatewayClient } from "../utils/api.js";
import { slugify } from "@airails/shared";

const STARTER_TEMPLATES: Record<string, string> = {
  "code-review": `# Code Review Prompt

Review the following code for:
- Correctness and potential bugs
- Performance implications
- Security concerns
- Adherence to project conventions

Provide specific, actionable feedback.
`,
  "test-gen": `# Test Generation Prompt

Generate tests for the following code:
- Cover happy paths and edge cases
- Test error handling
- Use descriptive test names
- Mock external dependencies at boundaries
`,
  docs: `# Documentation Prompt

Generate documentation for the following code:
- Explain the purpose and usage
- Document parameters and return values
- Include usage examples
- Note any important caveats or limitations
`,
  "commit-message": `# Commit Message Prompt

Generate a concise commit message for the following changes:
- Use conventional commit format (feat:, fix:, refactor:, etc.)
- First line under 72 characters
- Explain why, not what
`,
};

async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = await rl.question(`${question}${suffix}: `);
  rl.close();
  return answer.trim() || defaultValue || "";
}

function scaffoldProject(configDir: string, slug: string, gatewayUrl: string): void {
  mkdirSync(configDir, { recursive: true });
  mkdirSync(join(configDir, "prompts"), { recursive: true });
  mkdirSync(join(configDir, "overrides"), { recursive: true });
  mkdirSync(join(configDir, ".backups"), { recursive: true });

  const config: AirailsConfig = {
    product: { slug },
    gateway: { url: gatewayUrl },
    sync: { tools: ["claude", "cursor", "copilot"] },
  };
  writeFileSync(join(configDir, "config.yml"), stringify(config));

  const promptsDir = join(configDir, "prompts");
  for (const [name, content] of Object.entries(STARTER_TEMPLATES)) {
    writeFileSync(join(promptsDir, `${name}.md`), content);
  }

  const gitignorePath = ".gitignore";
  const backupsEntry = ".airails/.backups/";
  if (existsSync(gitignorePath)) {
    const existing = readFileSync(gitignorePath, "utf-8");
    if (!existing.includes(backupsEntry)) {
      writeFileSync(gitignorePath, `${existing.trimEnd()}\n${backupsEntry}\n`);
    }
  } else {
    writeFileSync(gitignorePath, `${backupsEntry}\n`);
  }
}

export const initCommand = new Command("init")
  .description("Initialize AIRails in the current repository")
  .option("--product <slug>", "Product slug to link")
  .option(
    "--gateway <url>",
    "Gateway URL",
    "http://localhost:8080",
  )
  .action(async (options: { product?: string; gateway: string }) => {
    const configDir = getConfigDir();

    if (existsSync(configDir)) {
      warn(
        ".airails/ already exists. Use `airails products switch` to change product.",
      );
      return;
    }

    let slug = options.product;

    // Interactive onboarding when no --product flag provided
    if (!slug) {
      console.log("\nWelcome to AIRails!\n");

      const name = await prompt("Product name");
      if (!name) {
        throw new Error("Product name is required");
      }

      const autoSlug = slugify(name);
      slug = await prompt("Slug", autoSlug);

      // Try to create the product via the gateway
      const apiKey = process.env["AIRAILS_API_KEY"] ?? process.env["AIRAILS_BOOTSTRAP_KEY"];
      if (apiKey) {
        try {
          const client = new GatewayClient(options.gateway, apiKey);
          const spin = spinner(`Creating product "${name}"...`);
          spin.start();
          await client.post("/api/products", { name, slug });
          spin.succeed(`Product "${name}" created`);
          success("You are the OWNER");
        } catch (err) {
          warn(`Could not create product via API: ${err instanceof Error ? err.message : String(err)}`);
          info("Create it manually in the dashboard or via the API.");
        }
      } else {
        info("No API key found. Create the product via the dashboard.");
        info("Set AIRAILS_API_KEY or AIRAILS_BOOTSTRAP_KEY to auto-create.");
      }
    }

    // Scaffold local config
    scaffoldProject(configDir, slug, options.gateway);
    success(`Created .airails/ for product "${slug}"`);
    success("Created starter prompt templates");

    // Auto-detect and link repo
    const repoFullName = getRepoFullName();
    if (repoFullName) {
      console.log(`\nRepository: ${repoFullName} (auto-detected from git remote)`);
      const apiKey = process.env["AIRAILS_API_KEY"] ?? process.env["AIRAILS_BOOTSTRAP_KEY"];
      if (apiKey) {
        try {
          const client = new GatewayClient(options.gateway, apiKey);
          const spin = spinner(`Linking ${repoFullName} to ${slug}...`);
          spin.start();
          await client.post(`/api/products/${slug}/repos`, {
            fullName: repoFullName,
          });
          spin.succeed(`Linked ${repoFullName} to ${slug}`);
        } catch {
          warn(
            `Could not link repo. Run \`airails repos add ${repoFullName}\` later.`,
          );
        }
      }
    }

    console.log("");
    info("Next steps:");
    info('  1. Run `airails keys create --label "Cursor"` to get an API key');
    info("  2. Run `airails sync` to generate native tool configs");
    info("  3. Run `airails hooks install` to auto-sync on commit");
  });
