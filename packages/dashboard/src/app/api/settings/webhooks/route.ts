import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

function getWebhookStatus(
  webhookActive: boolean,
  lastEventAt: Date | null,
): "CONNECTED" | "STALE" | "PENDING" {
  if (!webhookActive) return "PENDING";
  if (!lastEventAt) return "PENDING";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return lastEventAt > sevenDaysAgo ? "CONNECTED" : "STALE";
}

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const repos = await prisma.repo.findMany({
    where: { productId },
    orderBy: { fullName: "asc" },
  });

  const webhookUrl =
    process.env["NEXT_PUBLIC_GATEWAY_URL"] ??
    "http://localhost:8080";

  const repoStatuses = repos.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    webhookStatus: getWebhookStatus(r.webhookActive, r.lastEventAt),
    lastEventAt: r.lastEventAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    webhookUrl: `${webhookUrl}/webhooks/github`,
    repos: repoStatuses,
  });
}
