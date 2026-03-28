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

describe("Role-based access", () => {
  let productSlug: string;
  let ownerKey: string;
  let leadKey: string;
  let memberKey: string;
  let memberMembershipId: string;

  beforeAll(async () => {
    const product = await createTestProduct("Role Test Product");
    productSlug = product.slug;

    const owner = await createTestEngineer(product.id, "OWNER");
    ownerKey = owner.apiKey;

    const lead = await createTestEngineer(product.id, "LEAD");
    leadKey = lead.apiKey;

    const member = await createTestEngineer(product.id, "MEMBER");
    memberKey = member.apiKey;

    const membership = await prisma.productMembership.findFirstOrThrow({
      where: { productId: product.id, engineerId: member.engineer.id },
    });
    memberMembershipId = membership.id;
  });

  it("should_allow_OWNER_to_change_roles", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/products/${productSlug}/members/${memberMembershipId}`,
      headers: { authorization: `Bearer ${ownerKey}` },
      payload: { role: "LEAD" },
    });
    expect(response.statusCode).toBe(200);

    // Reset back
    await app.inject({
      method: "PATCH",
      url: `/api/products/${productSlug}/members/${memberMembershipId}`,
      headers: { authorization: `Bearer ${ownerKey}` },
      payload: { role: "MEMBER" },
    });
  });

  it("should_forbid_LEAD_from_changing_roles", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/products/${productSlug}/members/${memberMembershipId}`,
      headers: { authorization: `Bearer ${leadKey}` },
      payload: { role: "LEAD" },
    });
    expect(response.statusCode).toBe(403);
  });

  it("should_forbid_MEMBER_from_inviting", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/api/products/${productSlug}/members`,
      headers: { authorization: `Bearer ${memberKey}` },
      payload: { email: "new@test.com" },
    });
    expect(response.statusCode).toBe(403);
  });

  it("should_allow_LEAD_to_invite_members", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/api/products/${productSlug}/members`,
      headers: { authorization: `Bearer ${leadKey}` },
      payload: { email: "invited-by-lead@test.com" },
    });
    expect(response.statusCode).toBe(201);
  });

  it("should_allow_MEMBER_to_create_own_override", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/prompts",
      headers: { authorization: `Bearer ${memberKey}` },
      payload: {
        taskType: "code-review",
        name: "My Override",
        content: "Custom prompt",
        isBase: false,
      },
    });
    expect(response.statusCode).toBe(201);
  });

  it("should_forbid_MEMBER_from_creating_base_template", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/prompts",
      headers: { authorization: `Bearer ${memberKey}` },
      payload: {
        taskType: "docs",
        name: "Base Docs",
        content: "System prompt for docs",
        isBase: true,
      },
    });
    expect(response.statusCode).toBe(403);
  });
});
