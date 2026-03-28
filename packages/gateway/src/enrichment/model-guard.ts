import { prisma, Forbidden } from "@airails/shared";

export async function enforceModelAllowlist(
  productId: string,
  requestedModel: string,
): Promise<void> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { allowedModels: true },
  });

  if (product.allowedModels.length === 0) return;

  if (!product.allowedModels.includes(requestedModel)) {
    throw new Forbidden(
      `Model "${requestedModel}" is not allowed for this product. Allowed: ${product.allowedModels.join(", ")}`,
    );
  }
}
