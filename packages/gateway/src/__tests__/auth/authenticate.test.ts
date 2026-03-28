import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "@airails/shared";
import {
  createTestProduct,
  createTestEngineer,
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

describe("authenticateRequest", () => {
  let productId: string;
  let apiKey: string;
  let engineerId: string;

  beforeAll(async () => {
    const product = await createTestProduct("Auth Test Product");
    productId = product.id;
    const result = await createTestEngineer(productId, "OWNER");
    apiKey = result.apiKey;
    engineerId = result.engineer.id;
  });

  it("should_return_product_context_for_valid_key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    expect(response.statusCode).toBe(200);
  });

  it("should_throw_401_for_invalid_key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: "Bearer ar_k1_invalidkey" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("should_throw_401_for_revoked_key", async () => {
    const product = await createTestProduct("Revoke Test");
    const { apiKey: revokedKey } = await createTestEngineer(product.id);

    // Revoke the key
    const { hashApiKey } = await import("@airails/shared");
    const hashed = hashApiKey(revokedKey);
    await prisma.apiKey.update({
      where: { key: hashed },
      data: { isActive: false },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${revokedKey}` },
    });
    expect(response.statusCode).toBe(401);
  });

  it("should_throw_403_for_non_member", async () => {
    // Create engineer with key, then remove membership
    const product = await createTestProduct("Non-member Test");
    const { engineer, apiKey: nonMemberKey } = await createTestEngineer(product.id);

    await prisma.productMembership.deleteMany({
      where: { productId: product.id, engineerId: engineer.id },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${nonMemberKey}` },
    });
    expect(response.statusCode).toBe(403);
  });

  it("should_scope_to_correct_product", async () => {
    // Create second product with same engineer
    const productB = await createTestProduct("Scope Test B");
    await prisma.productMembership.create({
      data: { productId: productB.id, engineerId, role: "MEMBER" },
    });
    const { generateApiKey } = await import("@airails/shared");
    const { raw: keyB, hashed } = generateApiKey();
    await prisma.apiKey.create({
      data: { key: hashed, label: "B", engineerId, productId: productB.id },
    });

    // Query activities with key B — should return only B's data
    const response = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${keyB}` },
    });
    const data = JSON.parse(response.body) as { items: { productId: string }[] };
    for (const item of data.items) {
      expect(item.productId).toBe(productB.id);
    }
  });
});
