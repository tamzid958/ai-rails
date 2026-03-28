import { Command } from "commander";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import type { AirailsConfig } from "../utils/config.js";
import { getConfigDir } from "../utils/config.js";
import { getRepoFullName } from "../utils/git.js";
import { success, warn, info, spinner } from "../utils/ui.js";
import { GatewayClient } from "../utils/api.js";
import { getApiKey } from "../utils/credentials.js";

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

    const slug = options.product;
    if (!slug) {
      throw new Error(
        "Product slug required. Use `airails init --product <slug>`",
      );
    }

    // Scaffold directories
    mkdirSync(configDir, { recursive: true });
    mkdirSync(join(configDir, "prompts"), { recursive: true });
    mkdirSync(join(configDir, "overrides"), { recursive: true });
    mkdirSync(join(configDir, ".backups"), { recursive: true });

    // Write config
    const config: AirailsConfig = {
      product: { slug },
      gateway: { url: options.gateway },
      sync: { tools: ["claude", "cursor", "copilot"] },
    };
    writeFileSync(join(configDir, "config.yml"), stringify(config));

    // Write starter prompt templates
    const promptsDir = join(configDir, "prompts");
    for (const [name, content] of Object.entries(STARTER_TEMPLATES)) {
      writeFileSync(join(promptsDir, `${name}.md`), content);
    }

    // Add .backups to .gitignore
    const gitignorePath = ".gitignore";
    const backupsEntry = ".airails/.backups/";
    if (existsSync(gitignorePath)) {
      const existing = await import("node:fs").then((fs) =>
        fs.readFileSync(gitignorePath, "utf-8"),
      );
      if (!existing.includes(backupsEntry)) {
        writeFileSync(gitignorePath, `${existing.trimEnd()}\n${backupsEntry}\n`);
      }
    } else {
      writeFileSync(gitignorePath, `${backupsEntry}\n`);
    }

    success(`Initialized .airails/ for product "${slug}"`);

    // Try to link repo to product via API
    const repoFullName = getRepoFullName();
    if (repoFullName) {
      try {
        const apiKey = getApiKey();
        const client = new GatewayClient(options.gateway, apiKey);
        const spin = spinner(`Linking repo ${repoFullName} to ${slug}...`);
        spin.start();
        await client.post(`/api/products/${slug}/repos`, {
          fullName: repoFullName,
        });
        spin.succeed(`Linked repo ${repoFullName} to ${slug}`);
      } catch {
        warn(
          `Could not link repo to product. Run \`airails repos add ${repoFullName}\` later.`,
        );
      }
    }

    info("Next steps:");
    info("  1. Run `airails sync` to generate native tool configs");
    info("  2. Run `airails hooks install` to auto-sync on commit");
    info("  3. Run `airails doctor` to validate setup");
  });
