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

describe("spend cap enforcement via gateway", () => {
  it("should_block_request_when_daily_cap_exceeded", async () => {
    const product = await createTestProduct("Cap Test");
    await prisma.product.update({
      where: { id: product.id },
      data: { spendCapDaily: 0.01 },
    });

    const { engineer, apiKey } = await createTestEngineer(product.id, "MEMBER");

    // Create activity that exceeds the $0.01 cap
    await createTestActivity(product.id, engineer.id, {
      estimatedCost: 1.0,
      captureMethod: "GATEWAY",
    });

    // Attempt chat completion — should be blocked
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: `Bearer ${apiKey}` },
      payload: { model: "gpt-4o", messages: [{ role: "user", content: "test" }] },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().message).toContain("Daily spend cap reached");
  });

  it("should_allow_request_when_under_cap", async () => {
    const product = await createTestProduct("Under Cap Test");
    await prisma.product.update({
      where: { id: product.id },
      data: { spendCapDaily: 1000 },
    });

    const { apiKey } = await createTestEngineer(product.id, "MEMBER");

    // No activities yet — well under $1000 cap
    // Request will fail at LiteLLM (502) but should NOT fail at policy guard (403)
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: `Bearer ${apiKey}` },
      payload: { model: "gpt-4o", messages: [{ role: "user", content: "test" }] },
    });

    // Should NOT be 403 (policy block) — will be 502 (LiteLLM not running in test)
    expect(res.statusCode).not.toBe(403);
  });
});

describe("model allowlist enforcement", () => {
  it("should_block_disallowed_model", async () => {
    const product = await createTestProduct("Model Block Test");
    await prisma.product.update({
      where: { id: product.id },
      data: { allowedModels: ["gpt-4o"] },
    });

    const { apiKey } = await createTestEngineer(product.id, "MEMBER");

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: `Bearer ${apiKey}` },
      payload: { model: "claude-sonnet", messages: [{ role: "user", content: "test" }] },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().message).toContain("not allowed");
  });
});
