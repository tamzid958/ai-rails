import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHmac, randomBytes } from "node:crypto";

const adapter = new PrismaPg(process.env["DATABASE_URL"]!);
const prisma = new PrismaClient({ adapter });

const API_KEY_PREFIX = "ar_k1_";

function hashApiKey(raw: string): string {
  const secret = process.env["AIRAILS_SECRET"] ?? "change-this-to-a-random-secret";
  return createHmac("sha256", secret).update(raw).digest("hex");
}

function makeApiKey(): { raw: string; hashed: string } {
  const raw = `${API_KEY_PREFIX}${randomBytes(32).toString("hex")}`;
  return { raw, hashed: hashApiKey(raw) };
}

async function main() {
  console.log("Seeding database...");

  // ── Engineers (global) ──────────────────────────────────────────────

  const admin = await prisma.engineer.upsert({
    where: { email: "tamzid@team.com" },
    update: {},
    create: {
      name: "Tamzid",
      email: "tamzid@team.com",
      gitUsername: "tamzid958",
    },
  });

  const demo = await prisma.engineer.upsert({
    where: { email: "demo@team.com" },
    update: {},
    create: {
      name: "Demo Engineer",
      email: "demo@team.com",
      gitUsername: "demo-dev",
    },
  });

  // ── Products ────────────────────────────────────────────────────────

  const payments = await prisma.product.upsert({
    where: { slug: "payments-api" },
    update: {},
    create: {
      name: "Payments API",
      slug: "payments-api",
      description: "Core payment processing service",
      allowedModels: ["gpt-4o", "claude-sonnet"],
      defaultModel: "gpt-4o",
    },
  });

  const mobile = await prisma.product.upsert({
    where: { slug: "mobile-app" },
    update: {},
    create: {
      name: "Mobile App",
      slug: "mobile-app",
      description: "iOS and Android mobile application",
      allowedModels: ["gpt-4o-mini", "claude-haiku"],
      defaultModel: "gpt-4o-mini",
    },
  });

  // ── Memberships ─────────────────────────────────────────────────────

  await prisma.productMembership.upsert({
    where: { productId_engineerId: { productId: payments.id, engineerId: admin.id } },
    update: {},
    create: { productId: payments.id, engineerId: admin.id, role: "OWNER" },
  });

  await prisma.productMembership.upsert({
    where: { productId_engineerId: { productId: mobile.id, engineerId: admin.id } },
    update: {},
    create: { productId: mobile.id, engineerId: admin.id, role: "OWNER" },
  });

  await prisma.productMembership.upsert({
    where: { productId_engineerId: { productId: payments.id, engineerId: demo.id } },
    update: {},
    create: { productId: payments.id, engineerId: demo.id, role: "LEAD" },
  });

  await prisma.productMembership.upsert({
    where: { productId_engineerId: { productId: mobile.id, engineerId: demo.id } },
    update: {},
    create: { productId: mobile.id, engineerId: demo.id, role: "MEMBER" },
  });

  // ── API Keys (one per engineer per product) ─────────────────────────

  const keys = [
    { label: "Admin - Payments", engineerId: admin.id, productId: payments.id },
    { label: "Admin - Mobile", engineerId: admin.id, productId: mobile.id },
    { label: "Demo - Payments", engineerId: demo.id, productId: payments.id },
    { label: "Demo - Mobile", engineerId: demo.id, productId: mobile.id },
  ];

  for (const keyDef of keys) {
    const existing = await prisma.apiKey.findFirst({
      where: { engineerId: keyDef.engineerId, productId: keyDef.productId },
    });
    if (!existing) {
      const { raw, hashed } = makeApiKey();
      await prisma.apiKey.create({
        data: { key: hashed, ...keyDef },
      });
      console.log(`  API Key [${keyDef.label}]: ${raw}`);
    }
  }

  // ── Repos ───────────────────────────────────────────────────────────

  const repos = [
    { fullName: "org/payments-api", productId: payments.id },
    { fullName: "org/payments-lib", productId: payments.id },
    { fullName: "org/mobile-ios", productId: mobile.id },
  ];

  for (const repo of repos) {
    await prisma.repo.upsert({
      where: { fullName: repo.fullName },
      update: {},
      create: { ...repo, provider: "github", webhookActive: true },
    });
  }

  // ── Prompt Templates ────────────────────────────────────────────────

  const templates = [
    { productId: payments.id, taskType: "code-review", name: "Payments Code Review", content: "Review this code for security, correctness, and performance. Focus on payment handling edge cases.", isBase: true },
    { productId: payments.id, taskType: "test-gen", name: "Payments Test Generation", content: "Generate comprehensive tests including edge cases for payment flows. Cover happy path, validation errors, and idempotency.", isBase: true },
    { productId: mobile.id, taskType: "code-review", name: "Mobile Code Review", content: "Review this code for mobile best practices. Check for memory leaks, UI thread blocking, and accessibility.", isBase: true },
    { productId: mobile.id, taskType: "test-gen", name: "Mobile Test Generation", content: "Generate unit and snapshot tests for this component. Cover user interactions and state changes.", isBase: true },
  ];

  for (const tmpl of templates) {
    const existing = await prisma.promptTemplate.findFirst({
      where: { productId: tmpl.productId, taskType: tmpl.taskType, isBase: true },
    });
    if (!existing) {
      await prisma.promptTemplate.create({ data: tmpl });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
