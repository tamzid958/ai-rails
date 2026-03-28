import { Command } from "commander";
import Table from "cli-table3";
import { createClient, GatewayClient } from "../utils/api.js";
import { getActiveProduct } from "../utils/product-context.js";
import { getApiKey, saveApiKey, hasApiKey } from "../utils/credentials.js";
import { readConfig, writeConfig } from "../utils/config.js";
import { success, warn, spinner } from "../utils/ui.js";

interface ProductItem {
  name: string;
  slug: string;
  _count?: { repos: number; memberships: number };
}

interface ProductCreateResponse {
  id: string;
  name: string;
  slug: string;
}

interface KeyCreateResponse {
  id: string;
  key: string;
  label: string;
}

export const productsCommand = new Command("products").description(
  "Manage products",
);

productsCommand
  .command("list")
  .description("List all products")
  .action(async () => {
    const client = createClient();
    const spin = spinner("Fetching products...");
    spin.start();

    const { items } = await client.get<{ items: ProductItem[] }>(
      "/api/products",
    );
    spin.stop();

    const table = new Table({
      head: ["PRODUCT", "SLUG", "REPOS", "MEMBERS"],
    });

    for (const p of items) {
      table.push([
        p.name,
        p.slug,
        p._count?.repos ?? "—",
        p._count?.memberships ?? "—",
      ]);
    }

    console.log(table.toString());
  });

productsCommand
  .command("create <name>")
  .description("Create a new product")
  .action(async (name: string) => {
    const product = getActiveProduct();
    const apiKey = getApiKey();
    const client = new GatewayClient(product.gatewayUrl, apiKey);

    const spin = spinner(`Creating product "${name}"...`);
    spin.start();

    const created = await client.post<ProductCreateResponse>(
      "/api/products",
      { name },
    );
    spin.succeed(`Created product "${created.name}" (${created.slug})`);

    // Auto-generate an API key for the new product
    const keySpin = spinner("Generating API key...");
    keySpin.start();

    const keyRes = await client.post<KeyCreateResponse>("/api/keys", {
      label: "CLI (auto-generated)",
    });
    keySpin.stop();

    saveApiKey(created.slug, keyRes.key);
    success(`API key saved for ${created.slug}: ${keyRes.key}`);
    warn("Save this key — it cannot be retrieved again.");
  });

productsCommand
  .command("switch <slug>")
  .description("Switch active product for this repo")
  .action((slug: string) => {
    const config = readConfig();
    config.product = { slug };
    writeConfig(config);
    success(`Switched to product "${slug}"`);

    if (!hasApiKey(slug)) {
      warn(
        `No API key found for "${slug}". Run \`airails keys create --label "CLI"\``,
      );
    }
  });
