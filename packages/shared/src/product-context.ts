import type { MemberRole } from "@prisma/client";
import { prisma } from "./db.js";
import { Forbidden, NotFound, Unauthorized } from "./errors.js";

export interface ProductContext {
  productId: string;
  productSlug: string;
  engineerId: string;
  role: MemberRole;
}

export async function resolveProductFromApiKey(
  hashedKey: string,
): Promise<ProductContext> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    include: {
      engineer: true,
      product: true,
    },
  });

  if (!apiKey || !apiKey.isActive) {
    throw new Unauthorized("Invalid or revoked API key");
  }

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: apiKey.productId,
        engineerId: apiKey.engineerId,
      },
    },
  });

  if (!membership) {
    throw new Forbidden("Not a member of this product");
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    productId: apiKey.productId,
    productSlug: apiKey.product.slug,
    engineerId: apiKey.engineerId,
    role: membership.role,
  };
}

export async function resolveProductFromRepo(
  repoFullName: string,
): Promise<{ productId: string; productSlug: string }> {
  const repo = await prisma.repo.findUnique({
    where: { fullName: repoFullName },
    include: { product: true },
  });

  if (!repo) {
    throw new NotFound(`Repo ${repoFullName} not linked to any product`);
  }

  return {
    productId: repo.productId,
    productSlug: repo.product.slug,
  };
}
