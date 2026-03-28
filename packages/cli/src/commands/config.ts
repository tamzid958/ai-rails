import { Command } from "commander";
import { readConfig, writeConfig, configFileExists } from "../utils/config.js";
import { success, info, warn } from "../utils/ui.js";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const configCommand = new Command("config")
  .description("View or update AIRAILS configuration");

configCommand
  .command("show")
  .description("Display current configuration")
  .action(() => {
    if (!configFileExists()) {
      warn("No .airails/config.yml found. Run `airails init` first.");
      return;
    }
    const config = readConfig();
    console.log("");
    info(`Product:  ${config.product?.slug ?? "(not set)"}`);
    info(`Gateway:  ${config.gateway?.url ?? "(not set)"}`);
    info(`Tools:    ${config.sync?.tools?.join(", ") ?? "(not set)"}`);

    const apiKey = process.env["AIRAILS_API_KEY"];
    info(`API Key:  ${apiKey ? `${apiKey.slice(0, 16)}...` : "(set via AIRAILS_API_KEY env var)"}`);
    console.log("");
  });

configCommand
  .command("set")
  .description("Update configuration values")
  .option("--gateway-url <url>", "Set gateway URL")
  .option("--product <slug>", "Set product slug")
  .option("--api-key <key>", "Save API key to .env (local only)")
  .action((options: { gatewayUrl?: string; product?: string; apiKey?: string }) => {
    if (!options.gatewayUrl && !options.product && !options.apiKey) {
      warn("Nothing to set. Use --gateway-url, --product, or --api-key.");
      return;
    }

    if (options.gatewayUrl || options.product) {
      const config = configFileExists() ? readConfig() : {};

      if (options.gatewayUrl) {
        config.gateway = { ...config.gateway, url: options.gatewayUrl };
        success(`Gateway URL set to ${options.gatewayUrl}`);
      }

      if (options.product) {
        config.product = { slug: options.product };
        success(`Product set to ${options.product}`);
      }

      writeConfig(config);
    }

    if (options.apiKey) {
      // Write to .env in project root
      const envPath = resolve(".env");
      let envContent = "";
      if (existsSync(envPath)) {
        envContent = readFileSync(envPath, "utf-8");
      }

      if (envContent.includes("AIRAILS_API_KEY=")) {
        envContent = envContent.replace(/AIRAILS_API_KEY=.*/g, `AIRAILS_API_KEY=${options.apiKey}`);
      } else {
        envContent = `${envContent.trimEnd()}\nAIRAILS_API_KEY=${options.apiKey}\n`;
      }

      writeFileSync(envPath, envContent);
      success(`API key saved to .env`);
      info("Make sure .env is in your .gitignore!");
    }
  });
