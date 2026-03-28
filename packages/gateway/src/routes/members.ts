import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, AddMemberSchema, Forbidden, NotFound } from "@airails/shared";
import { requireRole } from "../auth/role-guard.js";
import { z } from "zod";

async function resolveProduct(slug: string, engineerId: string) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) throw new NotFound("Product not found");

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: { productId: product.id, engineerId },
    },
  });
  if (!membership) throw new Forbidden("Not a member of this product");

  return { product, membership };
}

export async function memberRoutes(app: FastifyInstance): Promise<void> {
  // List members
  app.get("/:slug/members", async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const { engineerId } = request.productContext;
    const { product } = await resolveProduct(slug, engineerId);

    const members = await prisma.productMembership.findMany({
      where: { productId: product.id },
      include: { engineer: true },
    });

    reply.send({
      items: members.map((m) => ({
        id: m.id,
        role: m.role,
        engineer: {
          id: m.engineer.id,
          name: m.engineer.name,
          email: m.engineer.email,
          gitUsername: m.engineer.gitUsername,
        },
        createdAt: m.createdAt,
      })),
      total: members.length,
      cursor: null,
    });
  });

  // Add member (OWNER/LEAD)
  app.post(
    "/:slug/members",
    { preHandler: [requireRole("OWNER", "LEAD")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug } = request.params as { slug: string };
      const { engineerId } = request.productContext;
      const { product, membership: callerMembership } = await resolveProduct(slug, engineerId);
      const data = AddMemberSchema.parse(request.body);

      // LEAD can only add as MEMBER or LEAD
      if (callerMembership.role === "LEAD" && data.role === "OWNER") {
        throw new Forbidden("LEAD cannot assign OWNER role");
      }

      // Find or create engineer
      let engineer = await prisma.engineer.findUnique({
        where: { email: data.email },
      });
      if (!engineer) {
        engineer = await prisma.engineer.create({
          data: { name: data.email.split("@")[0] ?? data.email, email: data.email },
        });
      }

      // Check if already a member
      const existing = await prisma.productMembership.findUnique({
        where: {
          productId_engineerId: { productId: product.id, engineerId: engineer.id },
        },
      });
      if (existing) {
        throw new Forbidden("Engineer is already a member of this product");
      }

      const membership = await prisma.productMembership.create({
        data: {
          productId: product.id,
          engineerId: engineer.id,
          role: data.role,
        },
        include: { engineer: true },
      });

      reply.status(201).send({
        id: membership.id,
        role: membership.role,
        engineer: {
          id: membership.engineer.id,
          name: membership.engineer.name,
          email: membership.engineer.email,
        },
      });
    },
  );

  // Change role (OWNER only)
  app.patch(
    "/:slug/members/:id",
    { preHandler: [requireRole("OWNER")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug, id } = request.params as { slug: string; id: string };
      const { engineerId } = request.productContext;
      const { product } = await resolveProduct(slug, engineerId);

      const RoleUpdateSchema = z.object({ role: z.enum(["OWNER", "LEAD", "MEMBER"]) });
      const { role } = RoleUpdateSchema.parse(request.body);

      const membership = await prisma.productMembership.findFirst({
        where: { id, productId: product.id },
      });
      if (!membership) throw new NotFound("Membership not found");

      const updated = await prisma.productMembership.update({
        where: { id },
        data: { role },
        include: { engineer: true },
      });

      reply.send({
        id: updated.id,
        role: updated.role,
        engineer: {
          id: updated.engineer.id,
          name: updated.engineer.name,
          email: updated.engineer.email,
        },
      });
    },
  );

  // Remove member (OWNER only)
  app.delete(
    "/:slug/members/:id",
    { preHandler: [requireRole("OWNER")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug, id } = request.params as { slug: string; id: string };
      const { engineerId } = request.productContext;
      const { product } = await resolveProduct(slug, engineerId);

      const membership = await prisma.productMembership.findFirst({
        where: { id, productId: product.id },
      });
      if (!membership) throw new NotFound("Membership not found");

      await prisma.productMembership.delete({ where: { id } });

      reply.status(204).send();
    },
  );
}
