import { Command } from "commander";
import { execSync } from "node:child_process";
import { AI_TOOLS, TASK_TYPES } from "@airails/shared";

type AiTool = (typeof AI_TOOLS)[number];
type TaskType = (typeof TASK_TYPES)[number];

function validateTool(value: string): string {
  if (!AI_TOOLS.includes(value as AiTool)) {
    throw new Error(
      `Invalid AI tool: "${value}". Valid tools: ${AI_TOOLS.join(", ")}`,
    );
  }
  return value;
}

function validateTaskType(value: string): string {
  if (!TASK_TYPES.includes(value as TaskType)) {
    throw new Error(
      `Invalid task type: "${value}". Valid types: ${TASK_TYPES.join(", ")}`,
    );
  }
  return value;
}

export const commitCommand = new Command("commit")
  .description("Git commit with AI metadata trailers")
  .requiredOption("-m, --message <message>", "Commit message")
  .option("--ai <tool>", "AI tool used", validateTool)
  .option("--task <type>", "Task type", validateTaskType)
  .option("--no-ai", "Explicitly mark as not AI-assisted")
  .action((options: { message: string; ai?: string | boolean; task?: string }) => {
    const args = ["git", "commit", "-m", options.message];

    if (typeof options.ai === "string") {
      args.push("--trailer", `AI-Assisted-By: ${options.ai}`);
    }
    if (options.task) {
      args.push("--trailer", `AI-Task-Type: ${options.task}`);
    }

    // Build a properly escaped command
    const cmd = args
      .map((arg) => {
        if (arg.includes(" ") || arg.includes(":")) {
          return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
      })
      .join(" ");

    execSync(cmd, { stdio: "inherit" });
  });
