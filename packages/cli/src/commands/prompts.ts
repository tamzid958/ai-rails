import { Command } from "commander";
import { execSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import Table from "cli-table3";
import { createClient } from "../utils/api.js";
import { getConfigDir } from "../utils/config.js";
import { success, info, spinner } from "../utils/ui.js";

interface PromptItem {
  id: string;
  name: string;
  taskType: string;
  isBase: boolean;
  content: string;
  version: number;
  engineer?: { name: string } | null;
  _count?: { usages: number };
}

export const promptsCommand = new Command("prompts").description(
  "Manage prompt templates",
);

promptsCommand
  .command("list")
  .description("List prompt templates for the active product")
  .action(async () => {
    const client = createClient();
    const spin = spinner("Fetching prompts...");
    spin.start();

    const { items } = await client.get<{ items: PromptItem[] }>(
      "/api/prompts",
    );
    spin.stop();

    const table = new Table({
      head: ["TEMPLATE", "TYPE", "BASE", "VERSION"],
    });

    for (const p of items) {
      table.push([
        p.name,
        p.taskType,
        p.isBase ? "yes" : "override",
        `v${p.version}`,
      ]);
    }

    console.log(table.toString());
  });

promptsCommand
  .command("add <name>")
  .description("Create a new prompt template")
  .requiredOption("--task <taskType>", "Task type for the template")
  .action(async (name: string, options: { task: string }) => {
    // Write a local template file
    const promptsDir = join(getConfigDir(), "prompts");
    mkdirSync(promptsDir, { recursive: true });

    const filePath = join(promptsDir, `${name}.md`);
    if (existsSync(filePath)) {
      throw new Error(
        `Template "${name}" already exists at ${filePath}`,
      );
    }

    const content = `# ${name}\n\nYour prompt template here.\n`;
    writeFileSync(filePath, content);
    success(`Created template at ${filePath}`);

    // Also create on the gateway
    try {
      const client = createClient();
      await client.post("/api/prompts", {
        name,
        taskType: options.task,
        content,
      });
      success("Synced template to gateway");
    } catch {
      info("Template saved locally. Run `airails sync` to push to gateway.");
    }
  });

promptsCommand
  .command("edit <name>")
  .description("Open a prompt template in $EDITOR")
  .action((name: string) => {
    const filePath = join(getConfigDir(), "prompts", `${name}.md`);
    if (!existsSync(filePath)) {
      throw new Error(
        `Template "${name}" not found. Run \`airails prompts add ${name}\` first.`,
      );
    }

    const editor = process.env["EDITOR"] ?? "vi";
    execSync(`${editor} ${filePath}`, { stdio: "inherit" });
    success(`Edited ${name}. Run \`airails sync\` to regenerate configs.`);
  });

promptsCommand
  .command("override <name>")
  .description("Create a personal override for a prompt template")
  .action((name: string) => {
    const basePath = join(getConfigDir(), "prompts", `${name}.md`);
    if (!existsSync(basePath)) {
      throw new Error(
        `Base template "${name}" not found.`,
      );
    }

    const overridesDir = join(getConfigDir(), "overrides");
    mkdirSync(overridesDir, { recursive: true });

    const overridePath = join(overridesDir, `${name}.md`);
    if (existsSync(overridePath)) {
      throw new Error(`Override for "${name}" already exists.`);
    }

    const baseContent = readFileSync(basePath, "utf-8");
    writeFileSync(overridePath, baseContent);
    success(`Created override at ${overridePath}`);
    info(
      `Edit the override, then run \`airails sync\` to apply.`,
    );
  });

promptsCommand
  .command("diff <name>")
  .description("Show diff between base template and override")
  .action((name: string) => {
    const basePath = join(getConfigDir(), "prompts", `${name}.md`);
    const overridePath = join(getConfigDir(), "overrides", `${name}.md`);

    if (!existsSync(basePath)) {
      throw new Error(`Base template "${name}" not found.`);
    }
    if (!existsSync(overridePath)) {
      throw new Error(`No override for "${name}".`);
    }

    try {
      execSync(`diff --color -u ${basePath} ${overridePath}`, {
        stdio: "inherit",
      });
      info("No differences.");
    } catch {
      // diff exits with 1 when files differ — output already printed
    }
  });

promptsCommand
  .command("promote <name>")
  .description("Promote a personal override to a base template (OWNER/LEAD)")
  .action(async (name: string) => {
    const client = createClient();

    // Get prompt by name
    const spin = spinner("Promoting template...");
    spin.start();

    const { items } = await client.get<{ items: PromptItem[] }>(
      "/api/prompts",
    );

    const prompt = items.find(
      (p) => p.name === name && !p.isBase,
    );
    if (!prompt) {
      spin.fail();
      throw new Error(
        `Override "${name}" not found on gateway.`,
      );
    }

    await client.post(`/api/prompts/${prompt.id}/promote`, {});
    spin.succeed(`Promoted "${name}" to base template`);
  });
