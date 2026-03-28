import { Command } from "commander";
import Table from "cli-table3";
import { createClient } from "../utils/api.js";
import { getActiveProduct } from "../utils/product-context.js";
import { spinner } from "../utils/ui.js";

interface MemberItem {
  id: string;
  role: string;
  engineer: {
    name: string;
    email: string;
    gitUsername: string | null;
  };
}

export const membersCommand = new Command("members").description(
  "Manage product members",
);

membersCommand
  .command("list")
  .description("List members of the active product")
  .action(async () => {
    const product = getActiveProduct();
    const client = createClient();
    const spin = spinner("Fetching members...");
    spin.start();

    const { items } = await client.get<{ items: MemberItem[] }>(
      `/api/products/${product.slug}/members`,
    );
    spin.stop();

    const table = new Table({
      head: ["NAME", "EMAIL", "ROLE", "GIT USERNAME"],
    });

    for (const m of items) {
      table.push([
        m.engineer.name,
        m.engineer.email,
        m.role,
        m.engineer.gitUsername ?? "—",
      ]);
    }

    console.log(table.toString());
  });

membersCommand
  .command("add <email>")
  .description("Add a member to the active product")
  .option("--role <role>", "Member role (OWNER, LEAD, MEMBER)", "MEMBER")
  .action(async (email: string, options: { role: string }) => {
    const product = getActiveProduct();
    const client = createClient();
    const spin = spinner(`Adding ${email}...`);
    spin.start();

    try {
      await client.post(`/api/products/${product.slug}/members`, {
        email,
        role: options.role.toUpperCase(),
      });
      spin.succeed(`Added ${email} as ${options.role.toUpperCase()}`);
    } catch (err) {
      spin.fail();
      if (err instanceof Error && err.message.includes("403")) {
        throw new Error(
          "Insufficient permissions. Only OWNER and LEAD can manage members.",
        );
      }
      throw err;
    }
  });

membersCommand
  .command("role <email> <role>")
  .description("Change a member's role")
  .action(async (email: string, role: string) => {
    const product = getActiveProduct();
    const client = createClient();

    // Find member by email
    const spin = spinner("Updating role...");
    spin.start();

    const { items } = await client.get<{ items: MemberItem[] }>(
      `/api/products/${product.slug}/members`,
    );

    const member = items.find((m) => m.engineer.email === email);
    if (!member) {
      spin.fail();
      throw new Error(
        `Member "${email}" not found in product "${product.slug}"`,
      );
    }

    try {
      await client.patch(
        `/api/products/${product.slug}/members/${member.id}`,
        { role: role.toUpperCase() },
      );
      spin.succeed(`Updated ${email} → ${role.toUpperCase()}`);
    } catch (err) {
      spin.fail();
      if (err instanceof Error && err.message.includes("403")) {
        throw new Error(
          "Insufficient permissions. Only OWNER can change roles.",
        );
      }
      throw err;
    }
  });

membersCommand
  .command("remove <email>")
  .description("Remove a member from the active product")
  .action(async (email: string) => {
    const product = getActiveProduct();
    const client = createClient();

    const spin = spinner(`Removing ${email}...`);
    spin.start();

    const { items } = await client.get<{ items: MemberItem[] }>(
      `/api/products/${product.slug}/members`,
    );

    const member = items.find((m) => m.engineer.email === email);
    if (!member) {
      spin.fail();
      throw new Error(
        `Member "${email}" not found in product "${product.slug}"`,
      );
    }

    try {
      await client.del(
        `/api/products/${product.slug}/members/${member.id}`,
      );
      spin.succeed(`Removed ${email} from ${product.slug}`);
    } catch (err) {
      spin.fail();
      if (err instanceof Error && err.message.includes("403")) {
        throw new Error(
          "Insufficient permissions. Only OWNER can remove members.",
        );
      }
      throw err;
    }
  });
