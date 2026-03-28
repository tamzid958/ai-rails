import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    url: process.env["DATABASE_URL"]!,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
