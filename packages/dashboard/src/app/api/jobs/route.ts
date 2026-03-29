import { NextResponse, type NextRequest } from "next/server";
import { getEngineerOrNull } from "@/lib/auth";
import { prisma } from "@airails/shared";

export async function POST(request: NextRequest) {
  const engineer = await getEngineerOrNull();
  if (!engineer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, job } = body;

  if (!productId || !job) {
    return NextResponse.json({ error: "Missing productId or job" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Forward to gateway/webhook service to trigger the job
  const gatewayUrl = process.env["NEXT_PUBLIC_GATEWAY_URL"] ?? "http://localhost:8080";

  try {
    const res = await fetch(`${gatewayUrl}/api/jobs/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, job }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[jobs] gateway returned ${res.status} for "${job}": ${err}`);
      return NextResponse.json({ success: true, job, note: "Gateway unavailable, data will refresh on next load" });
    }

    return NextResponse.json({ success: true, job });
  } catch (err) {
    // Gateway unreachable — still return success, data is recalculated on next page load
    console.warn(`[jobs] gateway unreachable for "${job}":`, err);
    return NextResponse.json({ success: true, job, note: "Gateway unreachable, data will refresh on next load" });
  }
}
