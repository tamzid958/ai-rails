import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "@airails/shared";
import {
  createTestProduct,
  createTestEngineer,
  createTestActivity,
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

describe("Product management", () => {
  it("should_list_only_member_products", async () => {
    const productA = await createTestProduct("List A");
    const productB = await createTestProduct("List B");

    // Engineer belongs to A only
    const { apiKey } = await createTestEngineer(productA.id, "OWNER");

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: { authorization: `Bearer ${apiKey}` },
    });

    const data = JSON.parse(response.body) as {
      items: { id: string; slug: string }[];
    };
    const ids = data.items.map((p) => p.id);
    expect(ids).toContain(productA.id);
    expect(ids).not.toContain(productB.id);
  });

  it("should_enforce_repo_global_uniqueness", async () => {
    const productA = await createTestProduct("Repo Unique A");
    const productB = await createTestProduct("Repo Unique B");

    const { apiKey: keyA } = await createTestEngineer(productA.id, "OWNER");
    const { apiKey: keyB } = await createTestEngineer(productB.id, "OWNER");

    // Add repo to product A
    const repoName = `org/unique-repo-${Date.now()}`;
    const res1 = await app.inject({
      method: "POST",
      url: `/api/products/${productA.slug}/repos`,
      headers: { authorization: `Bearer ${keyA}` },
      payload: { fullName: repoName },
    });
    expect(res1.statusCode).toBe(201);

    // Try to add same repo to product B
    const res2 = await app.inject({
      method: "POST",
      url: `/api/products/${productB.slug}/repos`,
      headers: { authorization: `Bearer ${keyB}` },
      payload: { fullName: repoName },
    });
    expect(res2.statusCode).toBe(403);
  });

  it("should_scope_activity_list_to_product", async () => {
    const productA = await createTestProduct("Scope Act A");
    const productB = await createTestProduct("Scope Act B");

    const { engineer, apiKey: keyA } = await createTestEngineer(
      productA.id,
      "OWNER",
    );

    // Add engineer to B
    await prisma.productMembership.create({
      data: { productId: productB.id, engineerId: engineer.id, role: "MEMBER" },
    });
    const { generateApiKey } = await import("@airails/shared");
    const { raw: keyB, hashed } = generateApiKey();
    await prisma.apiKey.create({
      data: { key: hashed, label: "B", engineerId: engineer.id, productId: productB.id },
    });

    // Create activities in both products
    await createTestActivity(productA.id, engineer.id, { tool: "cursor" });
    await createTestActivity(productB.id, engineer.id, { tool: "copilot" });

    // Query A
    const resA = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${keyA}` },
    });
    const dataA = JSON.parse(resA.body) as { items: { productId: string }[] };
    expect(dataA.items.every((a) => a.productId === productA.id)).toBe(true);

    // Query B
    const resB = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${keyB}` },
    });
    const dataB = JSON.parse(resB.body) as { items: { productId: string }[] };
    expect(dataB.items.every((a) => a.productId === productB.id)).toBe(true);
  });

  it("should_scope_cost_breakdown_to_product", async () => {
    const productA = await createTestProduct("Cost Scope A");
    const productB = await createTestProduct("Cost Scope B");

    const { engineer, apiKey: keyA } = await createTestEngineer(
      productA.id,
      "OWNER",
    );

    await prisma.productMembership.create({
      data: { productId: productB.id, engineerId: engineer.id, role: "MEMBER" },
    });
    const { generateApiKey } = await import("@airails/shared");
    const { raw: keyB, hashed } = generateApiKey();
    await prisma.apiKey.create({
      data: { key: hashed, label: "B", engineerId: engineer.id, productId: productB.id },
    });

    await createTestActivity(productA.id, engineer.id, {
      estimatedCost: 0.05,
      model: "gpt-4o",
    });
    await createTestActivity(productB.id, engineer.id, {
      estimatedCost: 0.10,
      model: "claude-sonnet",
    });

    const resA = await app.inject({
      method: "GET",
      url: "/api/costs",
      headers: { authorization: `Bearer ${keyA}` },
    });
    const dataA = JSON.parse(resA.body) as { total: number };
    // Product A cost only
    expect(dataA.total).toBeLessThanOrEqual(0.05);

    const resB = await app.inject({
      method: "GET",
      url: "/api/costs",
      headers: { authorization: `Bearer ${keyB}` },
    });
    const dataB = JSON.parse(resB.body) as { total: number };
    expect(dataB.total).toBeLessThanOrEqual(0.10);
  });
});
