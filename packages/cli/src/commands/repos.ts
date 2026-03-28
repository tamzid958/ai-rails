import { Command } from "commander";
import Table from "cli-table3";
import { createClient } from "../utils/api.js";
import { getActiveProduct } from "../utils/product-context.js";
import { spinner } from "../utils/ui.js";

interface RepoItem {
  id: string;
  fullName: string;
  provider: string;
  webhookActive: boolean;
  lastEventAt: string | null;
}

export const reposCommand = new Command("repos").description(
  "Manage linked repositories",
);

reposCommand
  .command("list")
  .description("List repositories linked to the active product")
  .action(async () => {
    const product = getActiveProduct();
    const client = createClient();
    const spin = spinner("Fetching repos...");
    spin.start();

    const { items } = await client.get<{ items: RepoItem[] }>(
      `/api/products/${product.slug}/repos`,
    );
    spin.stop();

    const table = new Table({
      head: ["REPO", "PROVIDER", "WEBHOOK", "LAST EVENT"],
    });

    for (const r of items) {
      table.push([
        r.fullName,
        r.provider,
        r.webhookActive ? "active" : "inactive",
        r.lastEventAt
          ? new Date(r.lastEventAt).toLocaleDateString()
          : "—",
      ]);
    }

    console.log(table.toString());
  });

reposCommand
  .command("add <fullName>")
  .description("Link a repository to the active product (org/repo)")
  .action(async (fullName: string) => {
    const product = getActiveProduct();
    const client = createClient();
    const spin = spinner(`Linking ${fullName}...`);
    spin.start();

    await client.post(`/api/products/${product.slug}/repos`, {
      fullName,
    });
    spin.succeed(`Linked ${fullName} to ${product.slug}`);
  });

reposCommand
  .command("remove <fullName>")
  .description("Unlink a repository from the active product")
  .action(async (fullName: string) => {
    const product = getActiveProduct();
    const client = createClient();

    // Find repo by fullName
    const spin = spinner(`Unlinking ${fullName}...`);
    spin.start();

    const { items } = await client.get<{ items: RepoItem[] }>(
      `/api/products/${product.slug}/repos`,
    );

    const repo = items.find((r) => r.fullName === fullName);
    if (!repo) {
      spin.fail();
      throw new Error(
        `Repo "${fullName}" not linked to product "${product.slug}"`,
      );
    }

    await client.del(`/api/products/${product.slug}/repos/${repo.id}`);
    spin.succeed(`Unlinked ${fullName} from ${product.slug}`);
  });
