import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@airails/shared";
import {
  createTestProduct,
  createTestEngineer,
  createTestActivity,
  createTestPrEvent,
  cleanupAll,
} from "@test/helpers/test-factory.js";
import { correlatePrToActivities } from "../../correlation/matcher.js";

afterAll(async () => {
  await cleanupAll();
  await prisma.$disconnect();
});

describe("Correlation Product Isolation", () => {
  it("should_not_correlate_activities_across_products", async () => {
    const productA = await createTestProduct("Corr Iso A");
    const productB = await createTestProduct("Corr Iso B");

    const { engineer } = await createTestEngineer(productA.id, "MEMBER");

    // Same engineer in product B
    await prisma.productMembership.create({
      data: { productId: productB.id, engineerId: engineer.id, role: "MEMBER" },
    });

    const sharedBranch = "feature/shared-branch";

    // Activity in Product A
    await createTestActivity(productA.id, engineer.id, {
      branchName: sharedBranch,
      tool: "cursor",
    });

    // PR in Product B (same branch name!)
    const prB = await createTestPrEvent(productB.id, engineer.id, {
      branchName: sharedBranch,
      status: "MERGED",
    });

    // Correlate PR in product B — should NOT link to product A's activity
    const result = await correlatePrToActivities({
      productId: productB.id,
      prEventId: prB.id,
      branchName: sharedBranch,
      engineerId: engineer.id,
      openedAt: new Date(),
    });

    expect(result.linked).toBe(0);

    // Verify the activity in A is still unlinked
    const activityA = await prisma.aiActivity.findFirst({
      where: { productId: productA.id, branchName: sharedBranch },
    });
    expect(activityA?.prEventId).toBeNull();
  });

  it("should_correlate_within_same_product", async () => {
    const product = await createTestProduct("Corr Same");
    const { engineer } = await createTestEngineer(product.id, "MEMBER");

    const branch = "feature/same-product";

    // Activity and PR in same product
    await createTestActivity(product.id, engineer.id, {
      branchName: branch,
      tool: "copilot",
    });

    const pr = await createTestPrEvent(product.id, engineer.id, {
      branchName: branch,
      status: "MERGED",
    });

    const result = await correlatePrToActivities({
      productId: product.id,
      prEventId: pr.id,
      branchName: branch,
      engineerId: engineer.id,
      openedAt: new Date(),
    });

    expect(result.linked).toBeGreaterThan(0);

    // Verify the activity is linked
    const activity = await prisma.aiActivity.findFirst({
      where: { productId: product.id, branchName: branch },
    });
    expect(activity?.prEventId).toBe(pr.id);
  });

  it("should_classify_data_richness_correctly", async () => {
    const product = await createTestProduct("Richness Test");
    const { engineer } = await createTestEngineer(product.id, "MEMBER");

    const branch = "feature/richness";

    // Create GATEWAY activity (highest richness)
    await createTestActivity(product.id, engineer.id, {
      branchName: branch,
      captureMethod: "GATEWAY",
    });

    const pr = await createTestPrEvent(product.id, engineer.id, {
      branchName: branch,
    });

    const result = await correlatePrToActivities({
      productId: product.id,
      prEventId: pr.id,
      branchName: branch,
      engineerId: engineer.id,
      openedAt: new Date(),
    });

    expect(result.richness).toBe("FULL");
  });
});
