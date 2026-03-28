import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";

const CONFIG_DIR = ".airails";
const CONFIG_FILE = join(CONFIG_DIR, "config.yml");

export interface AirailsConfig {
  product?: {
    slug: string;
  };
  gateway?: {
    url: string;
  };
  sync?: {
    tools: string[];
  };
}

export function configDirExists(): boolean {
  return existsSync(CONFIG_DIR);
}

export function configFileExists(): boolean {
  return existsSync(CONFIG_FILE);
}

export function readConfig(): AirailsConfig {
  if (!existsSync(CONFIG_FILE)) {
    throw new Error(
      "No .airails/config.yml found. Run `airails init` first.",
    );
  }
  return parse(readFileSync(CONFIG_FILE, "utf-8")) as AirailsConfig;
}

export function writeConfig(config: AirailsConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, stringify(config));
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigFile(): string {
  return CONFIG_FILE;
}
