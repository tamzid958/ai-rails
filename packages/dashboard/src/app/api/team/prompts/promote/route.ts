import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { logPromptAudit } from "@/lib/audit";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const engineer = await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const overrideId = searchParams.get("overrideId");

  if (!productId || !overrideId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId, engineerId: engineer.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const override = await prisma.promptTemplate.findUnique({
    where: { id: overrideId },
  });

  if (!override || override.productId !== productId || override.isBase) {
    return NextResponse.json({ error: "Invalid override" }, { status: 400 });
  }

  const base = override.parentId
    ? await prisma.promptTemplate.findUnique({ where: { id: override.parentId } })
    : null;

  if (!base) {
    return NextResponse.json({ error: "Base not found" }, { status: 400 });
  }

  const contentBefore = base.content;
  const newVersion = base.version + 1;

  await prisma.$transaction([
    prisma.promptTemplate.update({
      where: { id: base.id },
      data: {
        content: override.content,
        version: newVersion,
      },
    }),
  ]);

  logPromptAudit({
    productId,
    promptTemplateId: base.id,
    engineerId: engineer.id,
    action: "PROMOTE",
    version: newVersion,
    contentBefore,
    contentAfter: override.content,
    metadata: { sourceOverrideId: overrideId, sourceEngineerId: override.engineerId },
  });

  return NextResponse.json({ success: true });
});
