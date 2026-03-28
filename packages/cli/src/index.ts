#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { syncCommand } from "./commands/sync.js";
import { setupCommand } from "./commands/setup.js";
import { hooksCommand } from "./commands/hooks.js";
import { doctorCommand } from "./commands/doctor.js";
import { productsCommand } from "./commands/products.js";
import { keysCommand } from "./commands/keys.js";
import { membersCommand } from "./commands/members.js";
import { reposCommand } from "./commands/repos.js";
import { promptsCommand } from "./commands/prompts.js";
import { commitCommand } from "./commands/commit.js";
import { tagCommand } from "./commands/tag.js";
import { statusCommand } from "./commands/status.js";
import { configCommand } from "./commands/config.js";

const VERSION = "0.1.0";
const noColor = !!process.env["NO_COLOR"];

const program = new Command()
  .name("airails")
  .description("AI governance CLI for engineering teams")
  .version(VERSION);

// Core commands
program.addCommand(initCommand);
program.addCommand(syncCommand);
program.addCommand(setupCommand);
program.addCommand(hooksCommand);
program.addCommand(doctorCommand);

// Management commands
program.addCommand(productsCommand);
program.addCommand(keysCommand);
program.addCommand(membersCommand);
program.addCommand(reposCommand);
program.addCommand(promptsCommand);

// Tagging commands
program.addCommand(commitCommand);
program.addCommand(tagCommand);
program.addCommand(statusCommand);
program.addCommand(configCommand);

// Top-level error handler
program.exitOverride();

try {
  await program.parseAsync();
} catch (err) {
  if (err instanceof Error) {
    // Commander throws CommanderError for --help, --version, etc.
    if ("exitCode" in err && (err as { exitCode: number }).exitCode === 0) {
      process.exit(0);
    }
    const msg = err.message;
    console.error(noColor ? `\n✗ ${msg}` : `\n${chalk.red(`✗ ${msg}`)}`);
    process.exit(1);
  }
  throw err;
}
