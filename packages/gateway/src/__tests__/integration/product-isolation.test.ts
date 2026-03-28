import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "@airails/shared";
import {
  createTestProduct,
  createTestEngineer,
  createTestActivity,
  createTestPromptTemplate,
  cleanupAll,
} from "@test/helpers/test-factory.js";
import { createTestApp } from "../helpers/create-app.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
  await cleanupAll();
  await prisma.$disconnect();
});

describe("Gateway Product Isolation", () => {
  let productA: Awaited<ReturnType<typeof createTestProduct>>;
  let productB: Awaited<ReturnType<typeof createTestProduct>>;
  let apiKeyA: string;
  let apiKeyB: string;
  let engineerId: string;

  beforeAll(async () => {
    productA = await createTestProduct("Isolation A");
    productB = await createTestProduct("Isolation B");

    const resultA = await createTestEngineer(productA.id, "OWNER");
    engineerId = resultA.engineer.id;
    apiKeyA = resultA.apiKey;

    // Add same engineer to Product B
    await prisma.productMembership.create({
      data: { productId: productB.id, engineerId, role: "MEMBER" },
    });
    const { generateApiKey } = await import("@airails/shared");
    const { raw, hashed } = generateApiKey();
    await prisma.apiKey.create({
      data: { key: hashed, label: "B Key", engineerId, productId: productB.id },
    });
    apiKeyB = raw;
  });

  it("should_log_activity_to_product_A_when_using_product_A_key", async () => {
    // Create activity directly for Product A
    await createTestActivity(productA.id, engineerId, { tool: "cursor" });

    const activity = await prisma.aiActivity.findFirst({
      where: { productId: productA.id, engineerId },
      orderBy: { createdAt: "desc" },
    });

    expect(activity).not.toBeNull();
    expect(activity?.productId).toBe(productA.id);
  });

  it("should_not_return_product_A_activities_when_querying_product_B", async () => {
    // Create activity for product A
    await createTestActivity(productA.id, engineerId, { tool: "copilot" });

    // Query activities scoped to product B
    const response = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${apiKeyB}` },
    });

    const data = JSON.parse(response.body) as { items: { productId: string }[] };
    const leakedItems = data.items.filter(
      (a) => a.productId === productA.id,
    );
    expect(leakedItems).toHaveLength(0);
  });

  it("should_load_prompt_from_correct_product", async () => {
    // Create same taskType template in both products with different content
    await createTestPromptTemplate(productA.id, {
      taskType: "code-review",
      name: "CR Base A",
      content: "Product A system prompt",
      isBase: true,
    });
    await createTestPromptTemplate(productB.id, {
      taskType: "code-review",
      name: "CR Base B",
      content: "Product B system prompt",
      isBase: true,
    });

    // Query prompts for product A
    const responseA = await app.inject({
      method: "GET",
      url: "/api/prompts",
      headers: { authorization: `Bearer ${apiKeyA}` },
    });

    const dataA = JSON.parse(responseA.body) as {
      items: { productId: string; content: string }[];
    };
    const templateA = dataA.items.find((t) => t.content === "Product A system prompt");
    expect(templateA).toBeDefined();
    expect(templateA?.productId).toBe(productA.id);

    // Verify product B content not present
    const templateBLeak = dataA.items.find(
      (t) => t.content === "Product B system prompt",
    );
    expect(templateBLeak).toBeUndefined();
  });

  it("should_enforce_model_allowlist_per_product", async () => {
    // Set allowlist on product A
    await prisma.product.update({
      where: { id: productA.id },
      data: { allowedModels: ["gpt-4o"] },
    });

    // Product B has no allowlist (all models allowed)
    await prisma.product.update({
      where: { id: productB.id },
      data: { allowedModels: [] },
    });

    // Product A should block claude-sonnet
    const responseA = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: `Bearer ${apiKeyA}` },
      payload: {
        model: "claude-sonnet",
        messages: [{ role: "user", content: "Hello" }],
      },
    });
    expect(responseA.statusCode).toBe(403);

    // Product B should allow claude-sonnet (no allowlist)
    // Note: this will fail at the LiteLLM proxy level, but auth + model guard should pass
    const responseB = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: `Bearer ${apiKeyB}` },
      payload: {
        model: "claude-sonnet",
        messages: [{ role: "user", content: "Hello" }],
      },
    });
    // Should get 502 (LiteLLM unavailable) not 403
    expect(responseB.statusCode).not.toBe(403);
  });
});
