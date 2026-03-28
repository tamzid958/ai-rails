import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";

export async function GET(request: NextRequest) {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("productId");
  const engineerId = searchParams.get("engineerId") ?? engineer.id;

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prEvents = await prisma.prEvent.findMany({
    where: {
      productId,
      engineerId,
      aiActivitiesCount: { gt: 0 },
      aiToolsUsed: { isEmpty: false },
    },
    select: { status: true, reviewCycles: true, aiToolsUsed: true },
  });

  const toolMap = new Map<
    string,
    { accepted: number; revised: number; rejected: number }
  >();

  for (const pr of prEvents) {
    const tools = pr.aiToolsUsed as string[];
    const uniqueTools = [...new Set(tools)];

    for (const tool of uniqueTools) {
      const entry = toolMap.get(tool) ?? {
        accepted: 0,
        revised: 0,
        rejected: 0,
      };

      if (pr.status === "MERGED" && (pr.reviewCycles ?? 0) <= 1) {
        entry.accepted += 1;
      } else if (pr.status === "MERGED" && (pr.reviewCycles ?? 0) > 1) {
        entry.revised += 1;
      } else if (pr.status === "CLOSED") {
        entry.rejected += 1;
      }

      toolMap.set(tool, entry);
    }
  }

  const data = Array.from(toolMap.entries()).map(([tool, counts]) => ({
    tool,
    ...counts,
  }));

  return NextResponse.json(data);
}
