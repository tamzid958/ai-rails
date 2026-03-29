import { NextResponse, type NextRequest } from "next/server";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  await getEngineer();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const [keys, repos, activities, members] = await Promise.all([
    prisma.apiKey.count({ where: { productId, isActive: true } }),
    prisma.repo.count({ where: { productId } }),
    prisma.aiActivity.count({ where: { productId } }),
    prisma.productMembership.count({ where: { productId } }),
  ]);

  const steps = [
    { key: "product", label: "Create product", done: true },
    { key: "api_key", label: "Create an API key", done: keys > 0 },
    { key: "repo", label: "Link a repository", done: repos > 0 },
    { key: "member", label: "Invite a team member", done: members > 1 },
    { key: "activity", label: "First AI activity captured", done: activities > 0 },
  ];

  const completed = steps.filter((s) => s.done).length;

  return NextResponse.json({ steps, completed, total: steps.length });
});
