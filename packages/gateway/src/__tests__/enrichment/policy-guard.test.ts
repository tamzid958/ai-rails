import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@airails/shared";
import {
  createTestProduct,
  createTestEngineer,
  createTestActivity,
  cleanupAll,
} from "@test/helpers/test-factory.js";
import { enforceSpendCap } from "../../enrichment/policy-guard.js";

describe("enforceSpendCap", () => {
  let productId: string;
  let engineerId: string;

  beforeAll(async () => {
    const product = await createTestProduct("Policy Test");
    productId = product.id;
    const { engineer } = await createTestEngineer(productId, "MEMBER");
    engineerId = engineer.id;
  });

  afterAll(async () => {
    await cleanupAll();
    await prisma.$disconnect();
  });

  it("should_pass_when_no_caps_configured", async () => {
    const ctx = { productId, productSlug: "test", engineerId, role: "MEMBER" as const };
    await expect(enforceSpendCap(ctx)).resolves.toBeUndefined();
  });

  it("should_pass_when_under_daily_cap", async () => {
    await prisma.product.update({
      where: { id: productId },
      data: { spendCapDaily: 100 },
    });

    await createTestActivity(productId, engineerId, {
      estimatedCost: 5.0,
      captureMethod: "GATEWAY",
    });

    const ctx = { productId, productSlug: "test", engineerId, role: "MEMBER" as const };
    await expect(enforceSpendCap(ctx)).resolves.toBeUndefined();
  });

  it("should_block_when_over_daily_cap", async () => {
    await prisma.product.update({
      where: { id: productId },
      data: { spendCapDaily: 1.0 },
    });

    // Add activity that pushes over the $1 cap
    await createTestActivity(productId, engineerId, {
      estimatedCost: 2.0,
      captureMethod: "GATEWAY",
    });

    const ctx = { productId, productSlug: "test", engineerId, role: "MEMBER" as const };
    await expect(enforceSpendCap(ctx)).rejects.toThrow("Daily spend cap reached");
  });

  it("should_block_when_over_monthly_cap", async () => {
    // Reset daily cap, set monthly
    await prisma.product.update({
      where: { id: productId },
      data: { spendCapDaily: null, spendCapMonthly: 1.0 },
    });

    const ctx = { productId, productSlug: "test", engineerId, role: "MEMBER" as const };
    await expect(enforceSpendCap(ctx)).rejects.toThrow("Monthly spend cap reached");
  });
});
