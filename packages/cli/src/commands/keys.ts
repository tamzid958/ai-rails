import { Command } from "commander";
import Table from "cli-table3";
import { createClient } from "../utils/api.js";
import { getActiveProduct } from "../utils/product-context.js";
import { saveApiKey } from "../utils/credentials.js";
import { success, warn, spinner } from "../utils/ui.js";

interface KeyItem {
  id: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface KeyCreateResponse {
  id: string;
  key: string;
  label: string;
}

export const keysCommand = new Command("keys").description(
  "Manage API keys",
);

keysCommand
  .command("list")
  .description("List API keys for the active product")
  .action(async () => {
    const client = createClient();
    const spin = spinner("Fetching keys...");
    spin.start();

    const { items } = await client.get<{ items: KeyItem[] }>(
      "/api/keys",
    );
    spin.stop();

    const table = new Table({
      head: ["ID", "LABEL", "LAST USED", "CREATED"],
    });

    for (const k of items) {
      table.push([
        k.id.slice(0, 8),
        k.label,
        k.lastUsedAt
          ? new Date(k.lastUsedAt).toLocaleDateString()
          : "Never",
        new Date(k.createdAt).toLocaleDateString(),
      ]);
    }

    console.log(table.toString());
  });

keysCommand
  .command("create")
  .description("Create a new API key")
  .requiredOption("--label <label>", "Key label (e.g., 'Cursor', 'CLI')")
  .action(async (options: { label: string }) => {
    const product = getActiveProduct();
    const client = createClient();
    const spin = spinner("Creating API key...");
    spin.start();

    const res = await client.post<KeyCreateResponse>("/api/keys", {
      label: options.label,
    });
    spin.succeed("API key created");

    saveApiKey(product.slug, res.key);

    console.log();
    console.log(`  Key: ${res.key}`);
    console.log();
    warn("Save this key — it cannot be retrieved again.");
    success(`Saved to credentials for "${product.slug}"`);
  });

keysCommand
  .command("revoke <keyId>")
  .description("Revoke an API key")
  .action(async (keyId: string) => {
    const client = createClient();
    const spin = spinner("Revoking key...");
    spin.start();

    await client.del(`/api/keys/${keyId}`);
    spin.succeed(`Revoked key ${keyId.slice(0, 8)}...`);
  });
