import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

const MIN_SAMPLE_SIZE = 5;

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("productId");
  const dimension = searchParams.get("dimension");
  const value = searchParams.get("value");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  // Build activity filter based on dimension
  const activityFilter: Record<string, unknown> = {};
  if (dimension && value) {
    switch (dimension) {
      case "prompt":
        activityFilter.promptTemplateId = value;
        break;
      case "model":
        activityFilter.model = value;
        break;
      case "tool":
        activityFilter.tool = value;
        break;
      case "engineer":
        activityFilter.engineerId = value;
        break;
      case "prompt_model": {
        const [templateId, model] = value.split(":");
        activityFilter.promptTemplateId = templateId;
        activityFilter.model = model;
        break;
      }
    }
  }

  // Find PR IDs with matching linked activities
  const matchingActivities = await prisma.aiActivity.findMany({
    where: {
      productId,
      prEventId: { not: null },
      ...activityFilter,
    },
    select: { prEventId: true },
    distinct: ["prEventId"],
  });

  const prEventIds = matchingActivities
    .map((a) => a.prEventId)
    .filter((id): id is string => id !== null);

  const timeFilter: Record<string, unknown> = {};
  if (startParam) timeFilter.gte = new Date(startParam);
  if (endParam) timeFilter.lte = new Date(endParam);

  const prEvents = await prisma.prEvent.findMany({
    where: {
      id: prEventIds.length > 0 ? { in: prEventIds } : undefined,
      productId,
      aiActivitiesCount: { gt: 0 },
      status: { in: ["MERGED", "CLOSED", "REVERTED"] },
      ...(Object.keys(timeFilter).length > 0
        ? { openedAt: timeFilter }
        : {}),
    },
    select: { status: true, reviewCycles: true, openedAt: true },
    orderBy: { openedAt: "asc" },
  });

  const total = prEvents.length;

  const accepted = prEvents.filter(
    (pr) => pr.status === "MERGED" && (pr.reviewCycles ?? 0) <= 1,
  ).length;
  const revised = prEvents.filter(
    (pr) => pr.status === "MERGED" && (pr.reviewCycles ?? 0) > 1,
  ).length;
  const rejected = prEvents.filter(
    (pr) => pr.status === "CLOSED" || pr.status === "REVERTED",
  ).length;

  // Weekly trend (last 12 weeks)
  const trend: { week: string; acceptanceRate: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const weekPrs = prEvents.filter((pr) => {
      if (!pr.openedAt) return false;
      const opened = new Date(pr.openedAt);
      return opened >= weekStart && opened < weekEnd;
    });

    const weekAccepted = weekPrs.filter(
      (pr) => pr.status === "MERGED" && (pr.reviewCycles ?? 0) <= 1,
    ).length;

    const year = weekStart.getFullYear();
    const weekNum = Math.ceil(
      ((weekStart.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7,
    );

    trend.push({
      week: `${year}-W${String(weekNum).padStart(2, "0")}`,
      acceptanceRate:
        weekPrs.length >= MIN_SAMPLE_SIZE
          ? Math.round((weekAccepted / weekPrs.length) * 10000) / 10000
          : 0,
    });
  }

  return NextResponse.json({
    productId,
    productSlug: product?.slug ?? "",
    dimension: dimension ?? "all",
    scores: {
      acceptanceRate:
        total > 0 ? Math.round((accepted / total) * 10000) / 10000 : 0,
      revisionRate:
        total > 0 ? Math.round((revised / total) * 10000) / 10000 : 0,
      rejectionRate:
        total > 0 ? Math.round((rejected / total) * 10000) / 10000 : 0,
      sampleSize: total,
    },
    trend,
  });
});
