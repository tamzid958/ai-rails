import { describe, it, expect, afterAll } from "vitest";
import type { FastifyBaseLogger } from "fastify";
import { prisma } from "@airails/shared";
import {
  createTestProduct,
  createTestEngineer,
  createTestRepo,
  cleanupAll,
} from "@test/helpers/test-factory.js";
import { handlePushEvent } from "../../capture/push-handler.js";
import type { GitHubPushPayload, WebhookProduct } from "../../types.js";

const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => silentLogger,
  level: "silent",
  silent: () => {},
} as unknown as FastifyBaseLogger;

afterAll(async () => {
  await cleanupAll();
  await prisma.$disconnect();
});

describe("Webhook Product Routing", () => {
  it("should_route_push_event_to_correct_product_via_repo", async () => {
    const product = await createTestProduct("Webhook Route A");
    const { engineer } = await createTestEngineer(product.id, "MEMBER");
    const repo = await createTestRepo(product.id, "org/webhook-route-test");

    const payload: GitHubPushPayload = {
      ref: "refs/heads/main",
      commits: [
        {
          id: "abc123",
          message: "Fix bug\n\nAI-Assisted-By: cursor",
          author: {
            username: engineer.gitUsername ?? "",
            name: engineer.name,
            email: engineer.email,
          },
          timestamp: new Date().toISOString(),
          added: ["file.ts"],
          removed: [],
          modified: [],
        },
      ],
      repository: { full_name: repo.fullName },
    };

    const webhookProduct: WebhookProduct = {
      productId: product.id,
      productSlug: product.slug,
    };

    await handlePushEvent(payload, webhookProduct, silentLogger);

    const activity = await prisma.aiActivity.findFirst({
      where: { productId: product.id, engineerId: engineer.id },
    });

    expect(activity).not.toBeNull();
    expect(activity?.productId).toBe(product.id);
    expect(activity?.tool).toBe("cursor");
    expect(activity?.captureMethod).toBe("COMMIT_TAG");
  });

  it("should_create_AiActivity_with_correct_productId", async () => {
    const productA = await createTestProduct("Webhook A");
    const productB = await createTestProduct("Webhook B");
    const { engineer } = await createTestEngineer(productA.id, "MEMBER");

    // Same engineer in both products
    await prisma.productMembership.create({
      data: { productId: productB.id, engineerId: engineer.id, role: "MEMBER" },
    });

    await createTestRepo(productA.id, "org/webhook-correct-a");

    const payload: GitHubPushPayload = {
      ref: "refs/heads/feature/test",
      commits: [
        {
          id: "def456",
          message: "Add feature\n\nAI-Assisted-By: copilot",
          author: {
            username: engineer.gitUsername ?? "",
            name: engineer.name,
            email: engineer.email,
          },
          timestamp: new Date().toISOString(),
          added: [],
          removed: [],
          modified: ["src/main.ts"],
        },
      ],
      repository: { full_name: "org/webhook-correct-a" },
    };

    await handlePushEvent(
      payload,
      { productId: productA.id, productSlug: productA.slug },
      silentLogger,
    );

    // Activity should be in product A, not B
    const activityA = await prisma.aiActivity.findFirst({
      where: { productId: productA.id, commitSha: "def456" },
    });
    expect(activityA).not.toBeNull();

    const activityB = await prisma.aiActivity.findFirst({
      where: { productId: productB.id, commitSha: "def456" },
    });
    expect(activityB).toBeNull();
  });

  it("should_not_create_activity_for_non_member_engineer", async () => {
    const product = await createTestProduct("Non-member Webhook");
    await createTestRepo(product.id, "org/non-member-test");

    // Create engineer NOT in this product
    const otherProduct = await createTestProduct("Other Product");
    const { engineer } = await createTestEngineer(otherProduct.id, "MEMBER");

    const payload: GitHubPushPayload = {
      ref: "refs/heads/main",
      commits: [
        {
          id: "nonmem123",
          message: "Fix\n\nAI-Assisted-By: cursor",
          author: {
            username: engineer.gitUsername ?? "",
            name: engineer.name,
            email: engineer.email,
          },
          timestamp: new Date().toISOString(),
          added: [],
          removed: [],
          modified: ["file.ts"],
        },
      ],
      repository: { full_name: "org/non-member-test" },
    };

    await handlePushEvent(
      payload,
      { productId: product.id, productSlug: product.slug },
      silentLogger,
    );

    const activity = await prisma.aiActivity.findFirst({
      where: { productId: product.id, commitSha: "nonmem123" },
    });
    expect(activity).toBeNull();
  });
});
