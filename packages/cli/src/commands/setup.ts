import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { readConfig } from "../utils/config.js";
import { success, info } from "../utils/ui.js";

function patchJsonFile(
  filePath: string,
  patcher: (config: Record<string, unknown>) => void,
): void {
  let config: Record<string, unknown> = {};
  if (existsSync(filePath)) {
    config = JSON.parse(readFileSync(filePath, "utf-8")) as Record<
      string,
      unknown
    >;
  }
  patcher(config);

  const dir = filePath.includes("/")
    ? filePath.split("/").slice(0, -1).join("/")
    : null;
  if (dir) mkdirSync(dir, { recursive: true });

  writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n");
}

export const setupCommand = new Command("setup")
  .description("Patch IDE configs to route through the AIRails gateway")
  .action(async () => {
    const config = readConfig();
    const gatewayUrl = config.gateway?.url ?? "http://localhost:8080";
    const apiBase = `${gatewayUrl}/v1`;

    // Cursor settings
    patchJsonFile(".cursor/settings.json", (cfg) => {
      cfg["apiBase"] = apiBase;
    });
    success(`Patched .cursor/settings.json → apiBase: ${apiBase}`);

    // Continue.dev
    patchJsonFile(".continuerc.json", (cfg) => {
      cfg["apiBase"] = apiBase;
    });
    success(`Patched .continuerc.json → apiBase: ${apiBase}`);

    // VS Code settings
    patchJsonFile(".vscode/settings.json", (cfg) => {
      cfg["airails.gatewayUrl"] = gatewayUrl;
    });
    success(`Patched .vscode/settings.json → gatewayUrl: ${gatewayUrl}`);

    info("IDE configs patched. Restart your IDE to apply changes.");
  });
