import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  chmodSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { parse, stringify } from "yaml";
import { getActiveProduct } from "./product-context.js";

const CREDENTIALS_PATH = join(homedir(), ".airails", "credentials.yml");

function readCredentials(): Record<string, string> {
  if (!existsSync(CREDENTIALS_PATH)) return {};
  const content = readFileSync(CREDENTIALS_PATH, "utf-8");
  return (parse(content) as Record<string, string>) ?? {};
}

export function getApiKey(): string {
  const product = getActiveProduct();
  const credentials = readCredentials();
  const key =
    credentials[product.slug] ?? process.env["AIRAILS_API_KEY"];
  if (!key) {
    throw new Error(
      `No API key for product "${product.slug}". Run \`airails keys create --label "CLI"\``,
    );
  }
  return key;
}

export function saveApiKey(productSlug: string, key: string): void {
  const credentials = readCredentials();
  credentials[productSlug] = key;
  mkdirSync(dirname(CREDENTIALS_PATH), { recursive: true });
  writeFileSync(CREDENTIALS_PATH, stringify(credentials));
  chmodSync(CREDENTIALS_PATH, 0o600);
}

export function hasApiKey(productSlug: string): boolean {
  const credentials = readCredentials();
  return productSlug in credentials;
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "***";
  return `${key.slice(0, 8)}...`;
}
