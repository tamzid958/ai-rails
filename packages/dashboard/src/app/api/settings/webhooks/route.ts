import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
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

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { webhookSecret: true },
  });

  // Auto-generate secret if missing
  let webhookSecret = product?.webhookSecret;
  if (!webhookSecret) {
    webhookSecret = randomBytes(32).toString("hex");
    await prisma.product.update({
      where: { id: productId },
      data: { webhookSecret },
    });
  }

  const repos = await prisma.repo.findMany({
    where: { productId },
    orderBy: { fullName: "asc" },
  });

  const webhookBaseUrl = process.env["NEXT_PUBLIC_GATEWAY_URL"] ?? "http://localhost:8081";

  const repoStatuses = repos.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    provider: r.provider,
    webhookStatus: getWebhookStatus(r.webhookActive, r.lastEventAt),
    lastEventAt: r.lastEventAt?.toISOString() ?? null,
  }));

  // Only show secret to LEAD/OWNER
  const canSeeSecret = membership.role === "LEAD" || membership.role === "OWNER";

  return NextResponse.json({
    webhookUrl: {
      github: `${webhookBaseUrl}/webhooks/github`,
      gitlab: `${webhookBaseUrl}/webhooks/gitlab`,
    },
    webhookSecret: canSeeSecret ? webhookSecret : null,
    repos: repoStatuses,
  });
}
