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
let apiKey: string;
let productId: string;
let engineerId: string;

beforeAll(async () => {
  app = await createTestApp();

  const product = await createTestProduct("Filter Test");
  productId = product.id;
  const result = await createTestEngineer(productId, "OWNER");
  apiKey = result.apiKey;
  engineerId = result.engineer.id;

  // Create diverse activities
  await createTestActivity(productId, engineerId, {
    tool: "cursor",
    model: "gpt-4o",
    captureMethod: "GATEWAY",
  });
  await createTestActivity(productId, engineerId, {
    tool: "copilot",
    model: "claude-sonnet",
    captureMethod: "COMMIT_TAG",
  });
  await createTestActivity(productId, engineerId, {
    tool: "cursor",
    model: "gpt-4o-mini",
    captureMethod: "GATEWAY",
  });
});

afterAll(async () => {
  await app.close();
  await cleanupAll();
  await prisma.$disconnect();
});

describe("activity filtering", () => {
  it("should_filter_by_tool", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/activities?tool=cursor",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    const data = JSON.parse(res.body) as { items: { tool: string }[]; total: number };
    expect(res.statusCode).toBe(200);
    expect(data.total).toBe(2);
    expect(data.items.every((i) => i.tool === "cursor")).toBe(true);
  });

  it("should_filter_by_model", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/activities?model=gpt-4o",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    const data = JSON.parse(res.body) as { items: { model: string }[]; total: number };
    expect(res.statusCode).toBe(200);
    expect(data.total).toBe(1);
  });

  it("should_filter_by_captureMethod", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/activities?captureMethod=COMMIT_TAG",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    const data = JSON.parse(res.body) as { items: { captureMethod: string }[]; total: number };
    expect(res.statusCode).toBe(200);
    expect(data.total).toBe(1);
    expect(data.items[0].captureMethod).toBe("COMMIT_TAG");
  });

  it("should_return_all_when_no_filters", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/activities",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    const data = JSON.parse(res.body) as { total: number };
    expect(data.total).toBe(3);
  });
});

describe("CSV export", () => {
  it("should_return_csv_with_headers", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/activities/export",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    expect(res.statusCode).toBe(200);
    // raw stream writes — headers may not propagate through inject()
    const lines = res.body.split("\n").filter(Boolean);
    // Header + 3 data rows
    expect(lines.length).toBe(4);
    expect(lines[0]).toContain("id,createdAt,captureMethod");
  });

  it("should_filter_csv_export_by_date", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = await app.inject({
      method: "GET",
      url: `/api/activities/export?start=${futureDate}`,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    const lines = res.body.split("\n").filter(Boolean);
    // Header only, no data rows
    expect(lines.length).toBe(1);
  });
});
