import { Command } from "commander";
import Table from "cli-table3";
import chalk from "chalk";
import { createClient, type GatewayClient } from "../utils/api.js";
import { getActiveProduct } from "../utils/product-context.js";
import { spinner } from "../utils/ui.js";

const noColor = !!process.env["NO_COLOR"];

interface ActivityStats {
  totalActivities: number;
  byTool: Record<string, number>;
  totalCost: number;
  period: { start: string; end: string };
}

interface ProductItem {
  name: string;
  slug: string;
}

export const statusCommand = new Command("status")
  .description("Show AI usage status")
  .option("--team", "Show team activity (LEAD/OWNER)")
  .option("--costs", "Show cost breakdown")
  .option("--all-products", "Show cross-product summary")
  .action(
    async (options: {
      team?: boolean;
      costs?: boolean;
      allProducts?: boolean;
    }) => {
      const product = getActiveProduct();
      const client = createClient();

      if (options.allProducts) {
        await showAllProducts(client);
        return;
      }

      const spin = spinner("Fetching status...");
      spin.start();

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const start = weekAgo.toISOString();
      const end = now.toISOString();

      const stats = await client.get<ActivityStats>(
        `/api/activities/stats?start=${start}&end=${end}`,
      );
      spin.stop();

      const title = noColor
        ? `${product.slug} — Activity (last 7 days)`
        : chalk.bold(`${product.slug} — Activity (last 7 days)`);
      console.log(`\n${title}\n`);

      console.log(`  AI Activities:    ${stats.totalActivities}`);

      // Top tool
      const toolEntries = Object.entries(stats.byTool);
      if (toolEntries.length > 0) {
        toolEntries.sort((a, b) => b[1] - a[1]);
        const top = toolEntries[0];
        if (top) {
          console.log(`  Top Tool:         ${top[0]} (${top[1]} sessions)`);
        }
      }

      if (options.costs) {
        console.log(
          `  Total Cost:       $${stats.totalCost.toFixed(2)}`,
        );

        const costSpin = spinner("Fetching cost breakdown...");
        costSpin.start();

        const costData = await client.get<{
          items: { key: string; cost: number }[];
        }>(`/api/costs?groupBy=model&start=${start}&end=${end}`);
        costSpin.stop();

        if (costData.items.length > 0) {
          console.log("\n  Cost by Model:");
          const costTable = new Table({
            head: ["MODEL", "COST"],
          });
          for (const item of costData.items) {
            costTable.push([item.key, `$${item.cost.toFixed(2)}`]);
          }
          console.log(costTable.toString());
        }
      }

      console.log();
    },
  );

async function showAllProducts(
  client: GatewayClient,
): Promise<void> {
  const spin = spinner("Fetching cross-product summary...");
  spin.start();

  const { items: products } = await client.get<{
    items: ProductItem[];
  }>("/api/products");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start = weekAgo.toISOString();
  const end = now.toISOString();

  const stats = await client.get<ActivityStats>(
    `/api/activities/stats?start=${start}&end=${end}`,
  );
  spin.stop();

  const table = new Table({
    head: ["PRODUCT", "ACTIVITIES", "COST"],
  });

  // With the current API scoping to one product, show aggregated data
  for (const p of products) {
    table.push([
      p.name,
      stats.totalActivities.toString(),
      `$${stats.totalCost.toFixed(2)}`,
    ]);
  }

  console.log(table.toString());
}
