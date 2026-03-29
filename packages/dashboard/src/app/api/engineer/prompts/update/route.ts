import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { logPromptAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const engineer = await getEngineer();
  const body = await request.json();
  const { templateId, content } = body;

  if (!templateId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const template = await prisma.promptTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template || template.engineerId !== engineer.id) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });
  }

  const contentBefore = template.content;
  const newVersion = template.version + 1;

  await prisma.promptTemplate.update({
    where: { id: templateId },
    data: { content, version: { increment: 1 } },
  });

  logPromptAudit({
    productId: template.productId,
    promptTemplateId: templateId,
    engineerId: engineer.id,
    action: "UPDATE",
    version: newVersion,
    contentBefore,
    contentAfter: content,
  });

  return NextResponse.json({ success: true });
}
