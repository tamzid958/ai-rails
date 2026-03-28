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

  // ── AI Activities (realistic spread) ──────────────────────────────

  const tools = ["cursor", "copilot", "claude", "codex"];
  const models = ["gpt-4o", "gpt-4o-mini", "claude-sonnet", "claude-haiku"];
  const taskTypes = ["code-review", "test-gen", "docs", "commit-message", "refactor"];
  const captureMethods = ["GATEWAY", "COMMIT_TAG", "HEURISTIC"] as const;
  const branches = ["main", "feature/auth", "feature/payments", "fix/bug-123", "refactor/cleanup"];

  const existingActivities = await prisma.aiActivity.count();
  if (existingActivities === 0) {
    console.log("  Creating AI activities...");
    const activityData = [];
    const now = Date.now();

    for (const product of [payments, mobile]) {
      for (const engineer of [admin, demo]) {
        for (let i = 0; i < 25; i++) {
          const method = captureMethods[i % 3]!;
          const daysAgo = Math.floor(Math.random() * 30);
          const inputTokens = Math.floor(Math.random() * 2000) + 100;
          const outputTokens = Math.floor(Math.random() * 1000) + 50;
          const model = models[i % 4]!;
          const cost = method === "GATEWAY"
            ? parseFloat(((inputTokens * 0.003 + outputTokens * 0.015) / 1000).toFixed(4))
            : undefined;

          activityData.push({
            productId: product.id,
            engineerId: engineer.id,
            captureMethod: method,
            confidence: method === "HEURISTIC" ? 0.7 : 1.0,
            tool: tools[i % 4]!,
            provider: method === "GATEWAY" ? "openai" : undefined,
            model: method === "GATEWAY" ? model : undefined,
            taskType: taskTypes[i % 5]!,
            inputTokens: method === "GATEWAY" ? inputTokens : undefined,
            outputTokens: method === "GATEWAY" ? outputTokens : undefined,
            totalTokens: method === "GATEWAY" ? inputTokens + outputTokens : undefined,
            estimatedCost: cost,
            branchName: branches[i % 5]!,
            commitSha: method !== "GATEWAY" ? randomBytes(20).toString("hex") : undefined,
            repoFullName: product.id === payments.id ? "org/payments-api" : "org/mobile-ios",
            createdAt: new Date(now - daysAgo * 86400000 - Math.random() * 86400000),
          });
        }
      }
    }

    await prisma.aiActivity.createMany({ data: activityData });
    console.log(`  Created ${activityData.length} AI activities`);
  }

  // ── PR Events ───────────────────────────────────────────────────────

  const existingPrs = await prisma.prEvent.count();
  if (existingPrs === 0) {
    console.log("  Creating PR events...");
    const prStatuses = ["MERGED", "MERGED", "MERGED", "CLOSED", "REVERTED"] as const;
    const prData = [];

    for (const product of [payments, mobile]) {
      for (const engineer of [admin, demo]) {
        for (let i = 0; i < 8; i++) {
          const daysAgo = Math.floor(Math.random() * 30);
          const status = prStatuses[i % 5]!;
          const openedAt = new Date(Date.now() - (daysAgo + 2) * 86400000);
          const mergedAt = status === "MERGED" ? new Date(Date.now() - daysAgo * 86400000) : undefined;
          const closedAt = status !== "MERGED" ? new Date(Date.now() - daysAgo * 86400000) : undefined;

          prData.push({
            productId: product.id,
            externalId: `gh-${product.slug}-${engineer.id.slice(0, 4)}-${i}`,
            provider: "github",
            repoFullName: product.id === payments.id ? "org/payments-api" : "org/mobile-ios",
            prNumber: 100 + i,
            branchName: branches[i % 5]!,
            title: `PR #${100 + i}: ${["Fix auth flow", "Add tests", "Refactor DB", "Update docs", "Perf improvement", "Bug fix", "New feature", "Cleanup"][i]}`,
            engineerId: engineer.id,
            status,
            reviewCycles: Math.floor(Math.random() * 3),
            linesAdded: Math.floor(Math.random() * 500) + 10,
            linesRemoved: Math.floor(Math.random() * 200),
            filesChanged: Math.floor(Math.random() * 15) + 1,
            dataRichness: "FULL" as const,
            openedAt,
            mergedAt,
            closedAt,
          });
        }
      }
    }

    await prisma.prEvent.createMany({ data: prData });
    console.log(`  Created ${prData.length} PR events`);
  }

  // ── Recommendations ─────────────────────────────────────────────────

  const existingRecs = await prisma.recommendation.count();
  if (existingRecs === 0) {
    console.log("  Creating recommendations...");
    const recs = [
      {
        productId: payments.id,
        type: "prompt-drift",
        title: "High prompt drift detected for code-review",
        body: "Demo Engineer's code-review override has drifted significantly from the base template. Consider updating the base template to incorporate useful changes.",
        priority: 2,
        engineerId: demo.id,
      },
      {
        productId: payments.id,
        type: "cost-alert",
        title: "Daily AI cost spike detected",
        body: "AI spending increased 40% over the past 3 days. Review recent gateway usage for inefficient prompts or excessive token consumption.",
        priority: 3,
      },
      {
        productId: mobile.id,
        type: "tool-adoption",
        title: "Low AI tool adoption in mobile-app",
        body: "Only 1 of 2 engineers is actively using AI tools. Consider onboarding sessions or documentation to increase adoption.",
        priority: 1,
      },
      {
        productId: payments.id,
        type: "effectiveness",
        title: "Cursor shows highest acceptance rate",
        body: "PRs assisted by Cursor have a 85% first-pass acceptance rate vs 60% for Copilot. Consider standardizing on Cursor for code-review tasks.",
        priority: 2,
      },
    ];

    for (const rec of recs) {
      await prisma.recommendation.create({ data: rec });
    }
    console.log(`  Created ${recs.length} recommendations`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
