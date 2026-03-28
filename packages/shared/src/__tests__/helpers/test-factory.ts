import { randomBytes } from "node:crypto";
import { prisma } from "../../db.js";
import { generateApiKey } from "../../utils.js";
import type { MemberRole, CaptureMethod, Prisma } from "@prisma/client";

function randomId(): string {
  return randomBytes(6).toString("hex");
}

export async function createTestProduct(name?: string) {
  return prisma.product.create({
    data: {
      name: name ?? `Test Product ${randomId()}`,
      slug: `test-${randomId()}`,
    },
  });
}

export async function createTestEngineer(
  productId: string,
  role: MemberRole = "MEMBER",
) {
  const id = randomId();
  const engineer = await prisma.engineer.create({
    data: {
      name: `Engineer ${id}`,
      email: `test-${id}@test.com`,
      gitUsername: `testuser-${id}`,
    },
  });

  await prisma.productMembership.create({
    data: { productId, engineerId: engineer.id, role },
  });

  const { raw, hashed } = generateApiKey();
  await prisma.apiKey.create({
    data: {
      key: hashed,
      label: "Test Key",
      engineerId: engineer.id,
      productId,
    },
  });

  return { engineer, apiKey: raw };
}

export async function createTestActivity(
  productId: string,
  engineerId: string,
  overrides?: {
    captureMethod?: CaptureMethod;
    confidence?: number;
    tool?: string;
    model?: string;
    branchName?: string;
    commitSha?: string;
    repoFullName?: string;
    estimatedCost?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    prEventId?: string;
    promptTemplateId?: string;
    taskType?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return prisma.aiActivity.create({
    data: {
      productId,
      engineerId,
      captureMethod: "GATEWAY",
      confidence: 1.0,
      ...overrides,
      metadata: overrides?.metadata
        ? (overrides.metadata as Prisma.InputJsonValue)
        : undefined,
    } as Prisma.AiActivityUncheckedCreateInput,
  });
}

export async function createTestPrEvent(
  productId: string,
  engineerId: string,
  overrides?: {
    branchName?: string;
    prNumber?: number;
    status?: "OPENED" | "MERGED" | "CLOSED" | "REVERTED";
    reviewCycles?: number;
    repoFullName?: string;
    title?: string;
    openedAt?: Date;
  },
) {
  const id = randomId();
  return prisma.prEvent.create({
    data: {
      productId,
      externalId: `ext-${id}`,
      provider: "github",
      repoFullName: overrides?.repoFullName ?? `org/repo-${id}`,
      prNumber: overrides?.prNumber ?? Math.floor(Math.random() * 10000),
      branchName: overrides?.branchName ?? `feature/${id}`,
      title: overrides?.title ?? `PR ${id}`,
      engineerId,
      status: overrides?.status ?? "OPENED",
      reviewCycles: overrides?.reviewCycles ?? 0,
      openedAt: overrides?.openedAt ?? new Date(),
    },
  });
}

export async function createTestPromptTemplate(
  productId: string,
  overrides?: {
    taskType?: string;
    name?: string;
    content?: string;
    isBase?: boolean;
    engineerId?: string;
    parentId?: string;
  },
) {
  const id = randomId();
  return prisma.promptTemplate.create({
    data: {
      productId,
      taskType: overrides?.taskType ?? "general",
      name: overrides?.name ?? `Template ${id}`,
      content: overrides?.content ?? `System prompt ${id}`,
      isBase: overrides?.isBase ?? true,
      engineerId: overrides?.engineerId ?? null,
      parentId: overrides?.parentId ?? null,
    },
  });
}

export async function createTestRepo(
  productId: string,
  fullName?: string,
) {
  return prisma.repo.create({
    data: {
      productId,
      fullName: fullName ?? `org/repo-${randomId()}`,
      provider: "github",
    },
  });
}

export interface TwoProductFixture {
  productA: Awaited<ReturnType<typeof createTestProduct>>;
  productB: Awaited<ReturnType<typeof createTestProduct>>;
  engineer: Awaited<ReturnType<typeof createTestEngineer>>["engineer"];
  apiKeyA: string;
  apiKeyB: string;
}

export async function setupTwoProductScenario(): Promise<TwoProductFixture> {
  const productA = await createTestProduct("Product A");
  const productB = await createTestProduct("Product B");

  const { engineer, apiKey: apiKeyA } = await createTestEngineer(
    productA.id,
    "OWNER",
  );

  await prisma.productMembership.create({
    data: { productId: productB.id, engineerId: engineer.id, role: "MEMBER" },
  });

  const { raw: apiKeyB, hashed: hashedB } = generateApiKey();
  await prisma.apiKey.create({
    data: {
      key: hashedB,
      label: "Test Key B",
      engineerId: engineer.id,
      productId: productB.id,
    },
  });

  return { productA, productB, engineer, apiKeyA, apiKeyB };
}

export async function cleanupAll(): Promise<void> {
  await prisma.aiActivity.deleteMany();
  await prisma.prEvent.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.syncEvent.deleteMany();
  await prisma.promptTemplate.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.productMembership.deleteMany();
  await prisma.repo.deleteMany();
  await prisma.engineer.deleteMany();
  await prisma.product.deleteMany();
}
