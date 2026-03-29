import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@airails/shared";
import {
  createTestProduct,
  createTestEngineer,
  createTestActivity,
  createTestPrEvent,
  cleanupAll,
} from "@test/helpers/test-factory.js";
import { correlatePrToActivities } from "../../correlation/matcher.js";

describe("correlation transaction safety", () => {
  let productId: string;
  let engineerId: string;

  beforeAll(async () => {
    const product = await createTestProduct("Transaction Test");
    productId = product.id;
    const { engineer } = await createTestEngineer(productId, "OWNER");
    engineerId = engineer.id;
  });

  afterAll(async () => {
    await cleanupAll();
    await prisma.$disconnect();
  });

  it("should_link_activities_and_update_pr_atomically", async () => {
    const branch = "feature/atomic-test";

    const activity = await createTestActivity(productId, engineerId, {
      branchName: branch,
      tool: "cursor",
      totalTokens: 500,
    });

    const pr = await createTestPrEvent(productId, engineerId, {
      branchName: branch,
      status: "MERGED",
      openedAt: new Date(),
    });

    const result = await correlatePrToActivities({
      productId,
      prEventId: pr.id,
      branchName: branch,
      engineerId,
      openedAt: pr.openedAt ?? new Date(),
    });

    expect(result.linked).toBe(1);

    // Verify activity is linked
    const updatedActivity = await prisma.aiActivity.findUnique({
      where: { id: activity.id },
    });
    expect(updatedActivity?.prEventId).toBe(pr.id);

    // Verify PR metadata is updated
    const updatedPr = await prisma.prEvent.findUnique({
      where: { id: pr.id },
    });
    expect(updatedPr?.aiActivitiesCount).toBe(1);
    expect(updatedPr?.totalTokensUsed).toBe(500);
    expect(updatedPr?.aiToolsUsed).toContain("cursor");
  });

  it("should_not_relink_already_linked_activities", async () => {
    const branch = "feature/no-relink";

    const activity = await createTestActivity(productId, engineerId, {
      branchName: branch,
    });

    const pr1 = await createTestPrEvent(productId, engineerId, {
      branchName: branch,
      openedAt: new Date(),
    });

    // First correlation links the activity
    await correlatePrToActivities({
      productId,
      prEventId: pr1.id,
      branchName: branch,
      engineerId,
      openedAt: pr1.openedAt ?? new Date(),
    });

    const pr2 = await createTestPrEvent(productId, engineerId, {
      branchName: branch,
      openedAt: new Date(),
    });

    // Second correlation should not steal the activity
    const result = await correlatePrToActivities({
      productId,
      prEventId: pr2.id,
      branchName: branch,
      engineerId,
      openedAt: pr2.openedAt ?? new Date(),
    });

    expect(result.linked).toBe(0);

    const linkedActivity = await prisma.aiActivity.findUnique({
      where: { id: activity.id },
    });
    expect(linkedActivity?.prEventId).toBe(pr1.id);
  });
});
