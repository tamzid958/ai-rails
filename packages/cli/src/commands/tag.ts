import { Command } from "commander";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { AI_TOOLS, TASK_TYPES } from "@airails/shared";
import { success, info } from "../utils/ui.js";
import { getLastCommitHash } from "../utils/git.js";

async function promptSelect(
  message: string,
  choices: readonly string[],
): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${message}`);
  for (let i = 0; i < choices.length; i++) {
    console.log(`  ${i + 1}) ${choices[i]}`);
  }

  const answer = await rl.question("\nSelect (number): ");
  rl.close();

  const index = parseInt(answer, 10) - 1;
  const selected = choices[index];
  if (index < 0 || index >= choices.length || !selected) {
    throw new Error("Invalid selection.");
  }

  return selected;
}

export const tagCommand = new Command("tag")
  .description("Interactively tag the last commit with AI metadata")
  .action(async () => {
    const hash = getLastCommitHash();
    info(`Tagging commit ${hash}`);

    const tool = await promptSelect(
      "Which AI tool did you use?",
      AI_TOOLS,
    );
    const taskType = await promptSelect(
      "What type of task?",
      TASK_TYPES,
    );

    execSync(
      `git commit --amend --no-edit --trailer "AI-Assisted-By: ${tool}" --trailer "AI-Task-Type: ${taskType}"`,
      { stdio: "inherit" },
    );

    success(
      `Tagged commit ${hash} with AI-Assisted-By: ${tool}, AI-Task-Type: ${taskType}`,
    );
  });
