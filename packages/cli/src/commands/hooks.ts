import { Command } from "commander";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { success, warn } from "../utils/ui.js";

const HOOK_CONTENT = `#!/bin/sh
# Installed by airails — auto-sync prompt templates on commit
npx airails sync --quiet
git add CLAUDE.md .cursorrules .github/copilot-instructions.md .continuerc.json 2>/dev/null
`;

function getGitHooksDir(): string {
  try {
    return execSync("git rev-parse --git-path hooks", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return join(".git", "hooks");
  }
}

export const hooksCommand = new Command("hooks").description(
  "Manage git hooks for AIRails",
);

hooksCommand
  .command("install")
  .description("Install pre-commit hook that runs `airails sync`")
  .action(() => {
    const hooksDir = getGitHooksDir();
    const hookPath = join(hooksDir, "pre-commit");

    if (existsSync(hookPath)) {
      const existing = readFileSync(hookPath, "utf-8");
      if (existing.includes("airails sync")) {
        warn("Pre-commit hook already installed.");
        return;
      }
      warn("Existing pre-commit hook found. Appending airails sync.");
      writeFileSync(
        hookPath,
        `${existing.trimEnd()}\n\n${HOOK_CONTENT}`,
      );
    } else {
      writeFileSync(hookPath, HOOK_CONTENT);
    }

    chmodSync(hookPath, 0o755);
    success("Installed pre-commit hook → airails sync");
  });
