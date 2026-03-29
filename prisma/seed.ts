import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHmac, randomBytes } from "node:crypto";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) throw new Error("DATABASE_URL env var is required");
const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const API_KEY_PREFIX = "ar_k1_";

function hashApiKey(raw: string): string {
  const secret =
    process.env["AIRAILS_SECRET"] ?? "change-this-to-a-random-secret";
  return createHmac("sha256", secret).update(raw).digest("hex");
}

function makeApiKey(): { raw: string; hashed: string } {
  const raw = `${API_KEY_PREFIX}${randomBytes(32).toString("hex")}`;
  return { raw, hashed: hashApiKey(raw) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgoDate(daysAgo: number, jitter = true): Date {
  const base = Date.now() - daysAgo * 86_400_000;
  return new Date(base - (jitter ? Math.random() * 86_400_000 : 0));
}

// ── Constants ────────────────────────────────────────────────────────────────

const ENGINEER_NAMES = [
  { name: "Tamzid Ahmed", email: "tamjidahmed958@gmail.com", git: "tamzid958" },
  { name: "Sarah Chen", email: "sarah.chen@team.com", git: "sarahc" },
  { name: "Marcus Johnson", email: "marcus.j@team.com", git: "marcusj" },
  { name: "Priya Patel", email: "priya.p@team.com", git: "priyap" },
  { name: "Alex Kim", email: "alex.kim@team.com", git: "alexkim" },
  { name: "Jordan Rivera", email: "jordan.r@team.com", git: "jordanr" },
  { name: "Emily Zhang", email: "emily.z@team.com", git: "emilyz" },
  { name: "David Okafor", email: "david.o@team.com", git: "davido" },
  { name: "Mia Tanaka", email: "mia.t@team.com", git: "miat" },
  { name: "Chris Mueller", email: "chris.m@team.com", git: "chrism" },
  { name: "Fatima Al-Rashid", email: "fatima.a@team.com", git: "fatimaa" },
  { name: "Liam O'Brien", email: "liam.o@team.com", git: "liamo" },
  { name: "Nina Petrov", email: "nina.p@team.com", git: "ninap" },
  { name: "Raj Gupta", email: "raj.g@team.com", git: "rajg" },
  { name: "Sofia Hernandez", email: "sofia.h@team.com", git: "sofiah" },
];

const TOOLS = ["cursor", "copilot", "claude", "codex", "windsurf", "aider"];
const PROVIDERS = ["openai", "anthropic", "google", "mistral"];
const MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "claude-sonnet",
  "claude-haiku",
  "claude-opus",
  "gemini-pro",
  "mistral-large",
];
const TASK_TYPES = [
  "code-review",
  "test-gen",
  "docs",
  "commit-message",
  "refactor",
  "bug-fix",
  "feature-impl",
  "code-explain",
];
const CAPTURE_METHODS = ["GATEWAY", "COMMIT_TAG", "HEURISTIC"] as const;
const PR_STATUSES = [
  "OPENED",
  "REVIEW_IN_PROGRESS",
  "CHANGES_REQUESTED",
  "APPROVED",
  "MERGED",
  "CLOSED",
  "REVERTED",
] as const;
const DATA_RICHNESS = ["NONE", "HEURISTIC", "TAGGED", "FULL"] as const;

const REPO_NAMES = [
  "acme/payments-api",
  "acme/payments-sdk",
  "acme/payments-dashboard",
  "acme/payments-worker",
  "acme/payments-docs",
  "acme/payments-infra",
  "acme/payments-mobile",
  "acme/payments-analytics",
];

const BRANCHES = [
  "main",
  "develop",
  "feature/auth-v2",
  "feature/stripe-integration",
  "feature/webhooks",
  "feature/batch-processing",
  "feature/reporting-dashboard",
  "feature/multi-currency",
  "feature/rate-limiting",
  "feature/audit-log",
  "fix/race-condition",
  "fix/memory-leak",
  "fix/timeout-handling",
  "fix/null-pointer",
  "fix/decimal-precision",
  "refactor/service-layer",
  "refactor/db-queries",
  "refactor/error-handling",
  "chore/deps-update",
  "chore/ci-pipeline",
];

const PR_TITLES = [
  "Implement OAuth2 PKCE flow for merchant auth",
  "Add retry logic with exponential backoff",
  "Fix race condition in concurrent refund processing",
  "Migrate payment schema to support multi-currency",
  "Add comprehensive integration tests for webhook handler",
  "Refactor transaction service to use repository pattern",
  "Fix decimal precision loss in currency conversion",
  "Implement idempotency keys for payment creation",
  "Add rate limiting middleware with Redis backend",
  "Fix memory leak in long-running WebSocket connections",
  "Implement batch payment processing endpoint",
  "Add audit logging for all financial transactions",
  "Fix timeout handling in external payment gateway calls",
  "Migrate from REST to gRPC for internal services",
  "Add support for 3D Secure authentication flow",
  "Implement PCI DSS compliant card tokenization",
  "Fix null pointer in optional merchant metadata",
  "Add performance monitoring with OpenTelemetry",
  "Refactor error handling to use Result types",
  "Implement payment dispute resolution workflow",
  "Add Stripe Connect platform payment support",
  "Fix SQL injection vulnerability in search endpoint",
  "Implement real-time payment status via SSE",
  "Add comprehensive API rate limit documentation",
  "Fix broken pagination in transaction history",
  "Implement automatic payment reconciliation",
  "Add support for recurring subscription payments",
  "Fix timezone handling in settlement reports",
  "Refactor database queries to eliminate N+1",
  "Add circuit breaker for external API calls",
  "Implement payment analytics aggregation pipeline",
  "Fix CORS configuration for merchant dashboard",
  "Add webhook signature verification",
  "Implement partial refund support",
  "Fix connection pool exhaustion under load",
  "Add support for ACH bank transfers",
  "Refactor middleware chain for better testability",
  "Implement payment method prioritization",
  "Fix race condition in balance calculations",
  "Add comprehensive error codes documentation",
];

const REC_TEMPLATES: { type: string; title: string; body: string }[] = [
  {
    type: "prompt-drift",
    title: "High prompt drift detected for {taskType}",
    body: "{engineer}'s {taskType} override has drifted 45% from the base template. Consider updating the base or resetting the override.",
  },
  {
    type: "cost-alert",
    title: "Daily AI cost spike — {model}",
    body: "Spending on {model} increased {pct}% over the past 3 days. The team consumed {tokens} tokens yesterday alone.",
  },
  {
    type: "tool-adoption",
    title: "Low adoption of {tool} in the team",
    body: "Only {count} of {total} engineers are using {tool}. Adoption sessions could improve productivity by an estimated 20%.",
  },
  {
    type: "effectiveness",
    title: "{tool} shows highest PR acceptance rate",
    body: "PRs assisted by {tool} have an {pct}% first-pass acceptance rate. Consider standardizing for {taskType} tasks.",
  },
  {
    type: "security",
    title: "Sensitive data detected in AI prompts",
    body: "{count} prompts in the last week contained potential PII or secrets. Review prompt sanitization policies.",
  },
  {
    type: "performance",
    title: "Token usage anomaly for {engineer}",
    body: "{engineer} consumed {tokens} tokens in the last 24h — {mult}x the team average. Check for inefficient prompts.",
  },
  {
    type: "quality",
    title: "Low acceptance rate for {taskType} suggestions",
    body: "AI-generated {taskType} suggestions have a {pct}% rejection rate. The base prompt may need refinement.",
  },
  {
    type: "compliance",
    title: "Unapproved model usage detected",
    body: "{engineer} used {model} which is not in the approved model list. {count} activities logged with this model.",
  },
];

const PROMPT_TEMPLATES: { taskType: string; name: string; content: string }[] =
  [
    {
      taskType: "code-review",
      name: "Security-Focused Code Review",
      content:
        "Review this code for security vulnerabilities, injection risks, and auth bypass. Flag any hardcoded secrets or unsafe deserialization.",
    },
    {
      taskType: "code-review",
      name: "Performance Code Review",
      content:
        "Review for performance issues: N+1 queries, missing indexes, unnecessary allocations, blocking I/O on hot paths.",
    },
    {
      taskType: "test-gen",
      name: "Integration Test Generation",
      content:
        "Generate integration tests that cover API endpoints end-to-end. Include setup/teardown, realistic fixtures, and edge cases.",
    },
    {
      taskType: "test-gen",
      name: "Unit Test Generation",
      content:
        "Generate focused unit tests for pure business logic. Mock external dependencies. Cover happy path, edge cases, and error conditions.",
    },
    {
      taskType: "docs",
      name: "API Documentation",
      content:
        "Generate OpenAPI-compatible documentation for this endpoint. Include request/response schemas, error codes, and examples.",
    },
    {
      taskType: "docs",
      name: "Architecture Decision Record",
      content:
        "Write an ADR for this change. Include context, decision, consequences, and alternatives considered.",
    },
    {
      taskType: "commit-message",
      name: "Conventional Commit Message",
      content:
        "Generate a conventional commit message. Use feat/fix/refactor/docs prefix. Include scope. Body should explain why, not what.",
    },
    {
      taskType: "refactor",
      name: "Extract Service Pattern",
      content:
        "Refactor this code to extract business logic into a service layer. Separate concerns, add dependency injection points.",
    },
    {
      taskType: "bug-fix",
      name: "Root Cause Analysis",
      content:
        "Analyze this bug. Identify root cause, suggest fix, and recommend regression tests to prevent recurrence.",
    },
    {
      taskType: "feature-impl",
      name: "Feature Implementation Plan",
      content:
        "Break this feature into implementation steps. Identify affected files, required schema changes, and testing strategy.",
    },
    {
      taskType: "code-explain",
      name: "Code Walkthrough",
      content:
        "Explain this code to a new team member. Cover the control flow, key design decisions, and how it fits into the broader system.",
    },
    {
      taskType: "refactor",
      name: "Type Safety Improvement",
      content:
        "Refactor to improve type safety. Replace any types, add discriminated unions, use branded types for IDs.",
    },
  ];

const SYNC_TOOLS = [
  ".cursorrules",
  ".github/copilot-instructions.md",
  "CLAUDE.md",
  ".aider.conf.yml",
  ".windsurfrules",
  ".codex/config.yaml",
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database (full replace)...\n");

  // ── Wipe all existing data (order matters for FK constraints) ──────────────

  console.log("Clearing existing data...");
  await prisma.promptAuditLog.deleteMany();
  await prisma.aiActivity.deleteMany();
  await prisma.syncEvent.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.prEvent.deleteMany();
  await prisma.promptTemplate.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.repo.deleteMany();
  await prisma.productMembership.deleteMany();
  await prisma.product.deleteMany();
  await prisma.engineer.deleteMany();
  console.log("  ✓ All tables cleared\n");

  // ── 1. Engineers (15) ──────────────────────────────────────────────────────

  console.log("Creating engineers...");
  const engineers: { id: string; name: string; email: string }[] = [];

  for (const eng of ENGINEER_NAMES) {
    const record = await prisma.engineer.create({
      data: { name: eng.name, email: eng.email, gitUsername: eng.git },
    });
    engineers.push(record);
  }
  console.log(`  ✓ ${engineers.length} engineers`);

  // ── 2. Single Product ──────────────────────────────────────────────────────

  console.log("Creating product...");
  const product = await prisma.product.create({
    data: {
      name: "Payments API",
      slug: "payments-api",
      description:
        "Core payment processing platform — gateway, reconciliation, fraud detection, and merchant services",
      allowedModels: [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "claude-sonnet",
        "claude-haiku",
        "claude-opus",
        "gemini-pro",
        "mistral-large",
      ],
      defaultModel: "gpt-4o",
      costAlertDaily: 150.0,
      costAlertEngineer: 25.0,
      webhookSecret: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""),
    },
  });
  console.log(`  ✓ Product: ${product.name}`);

  // ── 3. Memberships (owner = tamjidahmed958@gmail.com) ──────────────────────

  console.log("Creating memberships...");
  for (let i = 0; i < engineers.length; i++) {
    const eng = engineers[i] as (typeof engineers)[number];
    const role =
      eng.email === "tamjidahmed958@gmail.com"
        ? "OWNER"
        : i < 3
          ? "LEAD"
          : "MEMBER";
    await prisma.productMembership.create({
      data: { productId: product.id, engineerId: eng.id, role },
    });
  }
  console.log(`  ✓ ${engineers.length} memberships`);

  // ── 4. API Keys ────────────────────────────────────────────────────────────

  console.log("Creating API keys...");
  for (const eng of engineers) {
    const { raw, hashed } = makeApiKey();
    await prisma.apiKey.create({
      data: {
        key: hashed,
        label: `${eng.name} — Payments`,
        engineerId: eng.id,
        productId: product.id,
        lastUsedAt: daysAgoDate(randInt(0, 7)),
      },
    });
    if (eng.email === "tamjidahmed958@gmail.com") {
      console.log(`  Owner API Key: ${raw}`);
    }
  }
  console.log(`  ✓ ${engineers.length} API keys`);

  // ── 5. Repos (8) ──────────────────────────────────────────────────────────

  console.log("Creating repos...");
  for (const fullName of REPO_NAMES) {
    await prisma.repo.create({
      data: {
        fullName,
        productId: product.id,
        provider: "github",
        webhookActive: true,
        lastEventAt: daysAgoDate(randInt(0, 5)),
      },
    });
  }
  console.log(`  ✓ ${REPO_NAMES.length} repos`);

  // ── 6. Prompt Templates (~75: 12 base + ~60 overrides) ─────────────────────

  console.log("Creating prompt templates...");
  const baseTemplates: { id: string; taskType: string }[] = [];
  let promptCount = 0;

  for (const tmpl of PROMPT_TEMPLATES) {
    const record = await prisma.promptTemplate.create({
      data: {
        productId: product.id,
        taskType: tmpl.taskType,
        name: tmpl.name,
        content: tmpl.content,
        isBase: true,
        usageCount: randInt(50, 500),
        acceptanceRate: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)),
        revisionRate: parseFloat((Math.random() * 0.2).toFixed(2)),
        rejectionRate: parseFloat((Math.random() * 0.15).toFixed(2)),
      },
    });
    baseTemplates.push({ id: record.id, taskType: record.taskType });
    promptCount++;
  }

  // Unique constraint: (productId, taskType, engineerId, isBase)
  // Deduplicate by taskType — pick one random base per taskType
  const baseByTaskType = new Map<string, { id: string; taskType: string }>();
  for (const b of baseTemplates) {
    if (!baseByTaskType.has(b.taskType) || Math.random() > 0.5) {
      baseByTaskType.set(b.taskType, b);
    }
  }
  const uniqueTaskBases = [...baseByTaskType.values()];

  for (const eng of engineers) {
    const overrideCount = randInt(3, Math.min(6, uniqueTaskBases.length));
    const shuffled = [...uniqueTaskBases].sort(() => Math.random() - 0.5);
    for (let i = 0; i < overrideCount; i++) {
      const base = shuffled[i] as (typeof shuffled)[number];
      await prisma.promptTemplate.create({
        data: {
          productId: product.id,
          taskType: base.taskType,
          name: `${eng.name}'s ${base.taskType} override`,
          content: `Custom ${base.taskType} prompt tailored for ${eng.name}'s workflow. Includes team-specific conventions and focus areas.`,
          isBase: false,
          parentId: base.id,
          engineerId: eng.id,
          version: randInt(1, 5),
          usageCount: randInt(10, 200),
          acceptanceRate: parseFloat(
            (Math.random() * 0.3 + 0.55).toFixed(2)
          ),
          revisionRate: parseFloat((Math.random() * 0.25).toFixed(2)),
          rejectionRate: parseFloat((Math.random() * 0.2).toFixed(2)),
        },
      });
      promptCount++;
    }
  }
  console.log(`  ✓ ${promptCount} prompt templates`);

  // ── 7. PR Events (~750) ────────────────────────────────────────────────────

  console.log("Creating PR events...");
  const prData: Prisma.PrEventCreateManyInput[] = [];
  let prCounter = 0;

  for (const eng of engineers) {
    const prCount = randInt(40, 70);
    for (let i = 0; i < prCount; i++) {
      prCounter++;
      const daysAgo = randInt(0, 90);
      const status = pick(PR_STATUSES);
      const openedAt = daysAgoDate(daysAgo + randInt(1, 5));
      const isMerged = status === "MERGED" || status === "APPROVED";
      const isClosed = status === "CLOSED" || status === "REVERTED";

      const linesAdded = randInt(5, 2000);
      const linesRemoved = randInt(0, Math.floor(linesAdded * 0.8));
      const filesChanged = randInt(1, 40);
      const reviewCycles = randInt(0, 6);
      const aiToolsUsed = Array.from(
        { length: randInt(0, 3) },
        () => pick(TOOLS)
      );
      const totalTokens = randInt(500, 50000);

      prData.push({
        productId: product.id,
        externalId: `gh-payments-${eng.id.slice(0, 6)}-${prCounter}`,
        provider: "github",
        repoFullName: pick(REPO_NAMES),
        prNumber: prCounter,
        branchName: pick(BRANCHES),
        title: pick(PR_TITLES),
        engineerId: eng.id,
        status,
        reviewCycles,
        linesAdded,
        linesRemoved,
        filesChanged,
        aiActivitiesCount: randInt(0, 20),
        totalTokensUsed: totalTokens,
        aiToolsUsed,
        dataRichness: pick(DATA_RICHNESS),
        openedAt,
        firstReviewAt: new Date(
          openedAt.getTime() + randInt(1, 48) * 3_600_000
        ),
        mergedAt: isMerged ? daysAgoDate(daysAgo) : undefined,
        closedAt: isClosed ? daysAgoDate(daysAgo) : undefined,
      });
    }
  }

  await prisma.prEvent.createMany({ data: prData });
  console.log(`  ✓ ${prData.length} PR events`);

  // Fetch PR IDs for linking activities
  const prRecords = await prisma.prEvent.findMany({
    where: { productId: product.id },
    select: { id: true, engineerId: true },
  });
  const prByEngineer = new Map<string, string[]>();
  for (const pr of prRecords) {
    if (!pr.engineerId) continue;
    const list = prByEngineer.get(pr.engineerId) ?? [];
    list.push(pr.id);
    prByEngineer.set(pr.engineerId, list);
  }

  // ── 8. AI Activities (~4500) ───────────────────────────────────────────────

  console.log("Creating AI activities...");
  const BATCH_SIZE = 500;
  let totalActivities = 0;

  for (const eng of engineers) {
    const actCount = randInt(250, 350);
    const engPrIds = prByEngineer.get(eng.id) ?? [];
    const actData: Prisma.AiActivityCreateManyInput[] = [];

    for (let i = 0; i < actCount; i++) {
      const method = pick(CAPTURE_METHODS);
      const daysAgo = randInt(0, 90);
      const isGateway = method === "GATEWAY";
      const inputTokens = randInt(100, 8000);
      const outputTokens = randInt(50, 4000);
      const model = pick(MODELS);
      const cost = isGateway
        ? parseFloat(
            (
              (inputTokens * 0.003 + outputTokens * 0.015) /
              1000
            ).toFixed(4)
          )
        : undefined;

      const linkedPrId =
        Math.random() < 0.3 && engPrIds.length > 0
          ? pick(engPrIds)
          : undefined;

      actData.push({
        productId: product.id,
        engineerId: eng.id,
        captureMethod: method,
        confidence:
          method === "HEURISTIC"
            ? parseFloat((Math.random() * 0.4 + 0.5).toFixed(2))
            : 1.0,
        tool: pick(TOOLS),
        provider: isGateway ? pick(PROVIDERS) : undefined,
        model: isGateway
          ? model
          : method === "COMMIT_TAG"
            ? pick(MODELS)
            : undefined,
        taskType: pick(TASK_TYPES),
        inputTokens: isGateway ? inputTokens : undefined,
        outputTokens: isGateway ? outputTokens : undefined,
        totalTokens: isGateway ? inputTokens + outputTokens : undefined,
        estimatedCost: cost,
        promptSnippet: isGateway
          ? `Review the following ${pick(TASK_TYPES)} changes in ${pick(REPO_NAMES)}...`
          : undefined,
        responseSnippet: isGateway
          ? `Based on my analysis of the code, here are the key findings...`
          : undefined,
        branchName: pick(BRANCHES),
        commitSha: !isGateway ? randomBytes(20).toString("hex") : undefined,
        repoFullName: pick(REPO_NAMES),
        prEventId: linkedPrId,
        metadata:
          Math.random() < 0.2
            ? {
                source: "ide-plugin",
                version: `${randInt(1, 3)}.${randInt(0, 9)}.${randInt(0, 20)}`,
              }
            : undefined,
        createdAt: daysAgoDate(daysAgo),
      });
    }

    for (let b = 0; b < actData.length; b += BATCH_SIZE) {
      await prisma.aiActivity.createMany({
        data: actData.slice(b, b + BATCH_SIZE),
      });
    }
    totalActivities += actData.length;
  }
  console.log(`  ✓ ${totalActivities} AI activities`);

  // ── 9. Recommendations (~200) ──────────────────────────────────────────────

  console.log("Creating recommendations...");
  const recData: Prisma.RecommendationCreateManyInput[] = [];

  for (let i = 0; i < 200; i++) {
    const tmpl = pick(REC_TEMPLATES);
    const eng = pick(engineers);
    const isEngSpecific = Math.random() < 0.6;

    recData.push({
      productId: product.id,
      engineerId: isEngSpecific ? eng.id : undefined,
      type: tmpl.type,
      title: tmpl.title
        .replace("{engineer}", eng.name)
        .replace("{tool}", pick(TOOLS))
        .replace("{model}", pick(MODELS))
        .replace("{taskType}", pick(TASK_TYPES)),
      body: tmpl.body
        .replace("{engineer}", eng.name)
        .replace("{tool}", pick(TOOLS))
        .replace("{model}", pick(MODELS))
        .replace("{taskType}", pick(TASK_TYPES))
        .replace("{pct}", String(randInt(15, 85)))
        .replace("{tokens}", String(randInt(5000, 150000)))
        .replace("{count}", String(randInt(1, 15)))
        .replace("{total}", String(engineers.length))
        .replace("{mult}", String(randInt(2, 8))),
      priority: randInt(1, 5),
      dismissedAt:
        Math.random() < 0.3 ? daysAgoDate(randInt(0, 30)) : undefined,
      data:
        Math.random() < 0.4
          ? {
              trend: Array.from({ length: 7 }, () => randInt(10, 200)),
              threshold: randInt(50, 100),
            }
          : undefined,
      createdAt: daysAgoDate(randInt(0, 60)),
    });
  }

  await prisma.recommendation.createMany({ data: recData });
  console.log(`  ✓ ${recData.length} recommendations`);

  // ── 10. Sync Events (~525) ─────────────────────────────────────────────────

  console.log("Creating sync events...");
  const syncData: Prisma.SyncEventCreateManyInput[] = [];

  for (const eng of engineers) {
    const syncCount = randInt(25, 45);
    for (let i = 0; i < syncCount; i++) {
      const toolCount = randInt(1, 4);
      const toolsGenerated = Array.from({ length: toolCount }, () =>
        pick(SYNC_TOOLS)
      );

      syncData.push({
        productId: product.id,
        engineerId: eng.id,
        repoFullName: pick(REPO_NAMES),
        toolsGenerated,
        backupsCreated: randInt(0, 3),
        configHash: randomBytes(16).toString("hex"),
        createdAt: daysAgoDate(randInt(0, 60)),
      });
    }
  }

  await prisma.syncEvent.createMany({ data: syncData });
  console.log(`  ✓ ${syncData.length} sync events`);

  // ── 11. Prompt Audit Logs (~400) ──────────────────────────────────────────

  console.log("Creating prompt audit logs...");

  // Fetch all prompt templates to reference in audit logs
  const allPromptTemplates = await prisma.promptTemplate.findMany({
    where: { productId: product.id },
    select: { id: true, taskType: true, name: true, content: true, isBase: true, engineerId: true, version: true },
  });

  const AUDIT_CONTENT_SAMPLES = [
    "Review this code for security vulnerabilities, injection risks, and auth bypass. Flag any hardcoded secrets.",
    "Generate integration tests that cover API endpoints end-to-end with realistic fixtures and edge cases.",
    "Refactor to extract business logic into a service layer with dependency injection points.",
    "Analyze this bug, identify root cause, suggest fix, and recommend regression tests.",
    "Generate OpenAPI-compatible documentation with request/response schemas and examples.",
    "Write an ADR for this change including context, decision, consequences, and alternatives.",
    "Generate focused unit tests for pure business logic. Mock external dependencies.",
    "Review for performance issues: N+1 queries, missing indexes, unnecessary allocations.",
    "Break this feature into implementation steps. Identify affected files and testing strategy.",
    "Explain this code to a new team member covering control flow and key design decisions.",
    "Custom prompt optimized for team conventions. Focus on domain-specific patterns.",
    "Refactor to improve type safety. Replace any types, add discriminated unions.",
  ];

  const auditData: Prisma.PromptAuditLogCreateManyInput[] = [];

  for (const tmpl of allPromptTemplates) {
    // Each template gets 2-6 audit entries representing its change history
    const entryCount = randInt(2, 6);

    for (let v = 1; v <= entryCount; v++) {
      const eng = tmpl.engineerId
        ? engineers.find((e) => e.id === tmpl.engineerId) ?? pick(engineers)
        : pick(engineers);

      let action: string;
      if (v === 1) {
        action = tmpl.isBase ? "CREATE_BASE" : "CREATE_OVERRIDE";
      } else if (v === entryCount && Math.random() < 0.1) {
        action = "PROMOTE";
      } else {
        action = "UPDATE";
      }

      const contentBefore = v > 1 ? pick(AUDIT_CONTENT_SAMPLES) : null;
      const contentAfter = pick(AUDIT_CONTENT_SAMPLES);

      const daysAgo = Math.max(0, 90 - v * randInt(5, 20));

      auditData.push({
        productId: product.id,
        promptTemplateId: tmpl.id,
        engineerId: eng.id,
        action,
        version: v,
        contentBefore,
        contentAfter,
        metadata:
          action === "PROMOTE"
            ? { promotedFrom: eng.name, reason: "Higher acceptance rate" }
            : action === "UPDATE"
              ? { changeReason: pick(["Performance improvement", "Style update", "Bug fix", "Team feedback", "A/B test result"]) }
              : undefined,
        createdAt: daysAgoDate(daysAgo),
      });
    }
  }

  await prisma.promptAuditLog.createMany({ data: auditData });
  console.log(`  ✓ ${auditData.length} prompt audit logs`);

  // ── Summary ────────────────────────────────────────────────────────────────

  const counts = await Promise.all([
    prisma.engineer.count(),
    prisma.product.count(),
    prisma.productMembership.count(),
    prisma.apiKey.count(),
    prisma.repo.count(),
    prisma.promptTemplate.count(),
    prisma.promptAuditLog.count(),
    prisma.prEvent.count(),
    prisma.aiActivity.count(),
    prisma.recommendation.count(),
    prisma.syncEvent.count(),
  ]);

  const total = counts.reduce((a, b) => a + b, 0);
  console.log(`\n══════════════════════════════════════`);
  console.log(`  Engineers:          ${counts[0]}`);
  console.log(`  Products:           ${counts[1]}`);
  console.log(`  Memberships:        ${counts[2]}`);
  console.log(`  API Keys:           ${counts[3]}`);
  console.log(`  Repos:              ${counts[4]}`);
  console.log(`  Prompt Templates:   ${counts[5]}`);
  console.log(`  Prompt Audit Logs:  ${counts[6]}`);
  console.log(`  PR Events:          ${counts[7]}`);
  console.log(`  AI Activities:      ${counts[8]}`);
  console.log(`  Recommendations:    ${counts[9]}`);
  console.log(`  Sync Events:        ${counts[10]}`);
  console.log(`  ────────────────────────────────────`);
  console.log(`  TOTAL RECORDS:      ${total}`);
  console.log(`══════════════════════════════════════\n`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
