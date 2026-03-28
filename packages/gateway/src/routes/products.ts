import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, ProductCreateSchema, ProductUpdateSchema, Forbidden, NotFound, slugify } from "@airails/shared";
import { requireRole } from "../auth/role-guard.js";

export async function productRoutes(app: FastifyInstance): Promise<void> {
  // List products this engineer belongs to
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const { engineerId } = request.productContext;

    const memberships = await prisma.productMembership.findMany({
      where: { engineerId },
      include: { product: true },
    });

    const items = memberships.map((m) => ({
      ...m.product,
      role: m.role,
    }));

    reply.send({ items, total: items.length, cursor: null });
  });

  // Create product (any authenticated engineer becomes OWNER)
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const { engineerId } = request.productContext;
    const data = ProductCreateSchema.parse(request.body);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug ?? slugify(data.name),
        description: data.description,
        allowedModels: data.allowedModels ?? [],
        defaultModel: data.defaultModel,
        costAlertDaily: data.costAlertDaily,
        costAlertEngineer: data.costAlertEngineer,
      },
    });

    await prisma.productMembership.create({
      data: {
        productId: product.id,
        engineerId,
        role: "OWNER",
      },
    });

    reply.status(201).send(product);
  });

  // Get product details (must be member — already enforced by auth)
  app.get("/:slug", async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const { engineerId } = request.productContext;

    const product = await prisma.product.findUnique({
      where: { slug },
    });
    if (!product) throw new NotFound("Product not found");

    // Verify membership
    const membership = await prisma.productMembership.findUnique({
      where: {
        productId_engineerId: {
          productId: product.id,
          engineerId,
        },
      },
    });
    if (!membership) throw new Forbidden("Not a member of this product");

    reply.send({ ...product, role: membership.role });
  });

  // Update product settings (OWNER only)
  app.patch(
    "/:slug",
    { preHandler: [requireRole("OWNER")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug } = request.params as { slug: string };
      const data = ProductUpdateSchema.parse(request.body);

      const existing = await prisma.product.findUnique({ where: { slug } });
      if (!existing) throw new NotFound("Product not found");

      // Verify caller is OWNER of THIS product (not just any product)
      const membership = await prisma.productMembership.findUnique({
        where: {
          productId_engineerId: {
            productId: existing.id,
            engineerId: request.productContext.engineerId,
          },
        },
      });
      if (!membership || membership.role !== "OWNER") {
        throw new Forbidden("Requires OWNER role for this product");
      }

      const updated = await prisma.product.update({
        where: { slug },
        data,
      });

      reply.send(updated);
    },
  );
}
