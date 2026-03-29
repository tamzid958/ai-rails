import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getWebhookStatus(
  webhookActive: boolean,
  lastEventAt: Date | null,
): "CONNECTED" | "STALE" | "PENDING" {
  if (!webhookActive) return "PENDING";
  if (!lastEventAt) return "PENDING";
  const age = Date.now() - lastEventAt.getTime();
  return age <= SEVEN_DAYS_MS ? "CONNECTED" : "STALE";
}

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const repos = await prisma.repo.findMany({
    where: { productId },
  });

  const rows = await Promise.all(
    repos.map(async (repo) => {
      const [activityCount, prCount] = await Promise.all([
        prisma.aiActivity.count({
          where: { productId, repoFullName: repo.fullName },
        }),
        prisma.prEvent.count({
          where: { productId, repoFullName: repo.fullName },
        }),
      ]);

      return {
        id: repo.id,
        fullName: repo.fullName,
        provider: repo.provider,
        activityCount,
        prCount,
        webhookStatus: getWebhookStatus(repo.webhookActive, repo.lastEventAt),
        lastEventAt: repo.lastEventAt?.toISOString() ?? null,
      };
    }),
  );

  return NextResponse.json(rows);
});
