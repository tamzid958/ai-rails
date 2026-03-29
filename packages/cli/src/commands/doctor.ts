import { Command } from "commander";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import chalk from "chalk";
import {
  configDirExists,
  configFileExists,
  readConfig,
  getConfigDir,
} from "../utils/config.js";
import { getApiKey, hasApiKey } from "../utils/credentials.js";
import { GatewayClient } from "../utils/api.js";
import { isGitRepo, getRepoFullName } from "../utils/git.js";

const noColor = !!process.env["NO_COLOR"];

function pass(msg: string): void {
  console.log(noColor ? `✓ ${msg}` : chalk.green(`✓ ${msg}`));
}

function fail(msg: string, fix?: string): void {
  console.log(noColor ? `✗ ${msg}` : chalk.red(`✗ ${msg}`));
  if (fix) {
    console.log(noColor ? `  → ${fix}` : chalk.yellow(`  → ${fix}`));
  }
}

export const doctorCommand = new Command("doctor")
  .description("Validate AIRails setup and connectivity")
  .action(async () => {
    let allPassed = true;
    const markFail = (msg: string, fix?: string) => {
      fail(msg, fix);
      allPassed = false;
    };

    // 1. .airails/ directory
    if (configDirExists()) {
      pass(".airails/ directory exists");
    } else {
      markFail(
        ".airails/ directory missing",
        "Run: airails init --product <your-product-slug>",
      );
      return;
    }

    // 2. config.yml
    if (configFileExists()) {
      pass("config.yml exists");
    } else {
      markFail("config.yml missing", "Run: airails init");
      return;
    }

    // 3. Product slug
    let slug: string;
    let gatewayUrl: string;
    try {
      const config = readConfig();
      slug = config.product?.slug ?? "";
      gatewayUrl = config.gateway?.url ?? "http://localhost:8080";
      if (slug) {
        pass(`Product: ${slug}`);
      } else {
        markFail(
          "No product.slug in config.yml",
          "Run: airails init --product <your-product-slug>",
        );
        return;
      }
    } catch {
      markFail("config.yml is invalid", "Delete .airails/config.yml and run: airails init");
      return;
    }

    // 4. Git repo
    if (isGitRepo()) {
      pass("Inside a git repository");
    } else {
      markFail("Not inside a git repository", "Run: git init");
    }

    // 5. Repo detected
    const repoFullName = getRepoFullName();
    if (repoFullName) {
      pass(`Repo: ${repoFullName}`);
    } else {
      markFail("Could not detect repo from git remote", "Run: git remote add origin <repo-url>");
    }

    // 6. Prompt templates
    const promptsDir = join(getConfigDir(), "prompts");
    if (existsSync(promptsDir)) {
      const templates = readdirSync(promptsDir).filter((f) =>
        f.endsWith(".md"),
      );
      if (templates.length > 0) {
        pass(`${templates.length} prompt template(s) found`);
      } else {
        markFail("No prompt templates in .airails/prompts/", "Run: airails sync — or create .airails/prompts/<task-type>.md files manually");
      }
    } else {
      markFail(".airails/prompts/ directory missing", "Run: mkdir -p .airails/prompts && airails sync");
    }

    // 7. Pre-commit hook
    try {
      const hooksDir = execSync("git rev-parse --git-path hooks", {
        encoding: "utf-8",
      }).trim();
      const hookPath = join(hooksDir, "pre-commit");
      if (
        existsSync(hookPath) &&
        readFileSync(hookPath, "utf-8").includes("airails sync")
      ) {
        pass("Pre-commit hook installed");
      } else {
        markFail(
          "Pre-commit hook not installed",
          "Run: airails hooks install",
        );
      }
    } catch {
      markFail("Could not check git hooks", "Ensure you are in a git repository with: git rev-parse --git-dir");
    }

    // 8. API key
    if (hasApiKey(slug)) {
      pass(`API key found for ${slug}`);
    } else if (process.env["AIRAILS_API_KEY"]) {
      pass("API key found via AIRAILS_API_KEY env var");
    } else {
      markFail(
        `No API key for "${slug}"`,
        `Run: airails keys create --label "CLI" — or set AIRAILS_API_KEY env var`,
      );
    }

    // 9. Gateway reachable
    try {
      const res = await fetch(`${gatewayUrl}/health`);
      if (res.ok) {
        pass(`Gateway reachable at ${gatewayUrl}`);
      } else {
        markFail(`Gateway returned ${res.status} at ${gatewayUrl}`, "Check gateway logs: docker compose logs gateway");
      }
    } catch {
      markFail(
        `Gateway not reachable at ${gatewayUrl}`,
        "Start the gateway: docker compose up -d gateway — or check gateway.url in .airails/config.yml",
      );
    }

    // 10. API key valid (product + membership check)
    try {
      const apiKey = getApiKey();
      const client = new GatewayClient(gatewayUrl, apiKey);
      const product = await client.get<{ slug: string }>(
        `/api/products/${slug}`,
      );
      pass(`API key valid (product: ${product.slug})`);
    } catch {
      markFail("API key invalid or product not accessible", `Run: airails keys create --label "CLI" — then: airails config set --api-key <new-key>`);
    }

    console.log();
    if (allPassed) {
      pass("All checks passed");
    } else {
      markFail("Some checks failed — see above");
    }
  });
