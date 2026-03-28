import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, Forbidden, NotFound } from "@airails/shared";
import { requireRole } from "../auth/role-guard.js";
import { z } from "zod";

const AddRepoSchema = z.object({
  fullName: z.string().min(1),
  provider: z.string().default("github"),
  webhookActive: z.boolean().default(false),
});

async function resolveProduct(slug: string, engineerId: string) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) throw new NotFound("Product not found");
  const membership = await prisma.productMembership.findUnique({
    where: { productId_engineerId: { productId: product.id, engineerId } },
  });
  if (!membership) throw new Forbidden("Not a member of this product");
  return { product, membership };
}

export async function repoRoutes(app: FastifyInstance): Promise<void> {
  // List repos
  app.get("/:slug/repos", async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const { engineerId } = request.productContext;
    const { product } = await resolveProduct(slug, engineerId);

    const repos = await prisma.repo.findMany({
      where: { productId: product.id },
    });

    reply.send({ items: repos, total: repos.length, cursor: null });
  });

  // Add repo (OWNER/LEAD)
  app.post(
    "/:slug/repos",
    { preHandler: [requireRole("OWNER", "LEAD")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug } = request.params as { slug: string };
      const { engineerId } = request.productContext;
      const { product } = await resolveProduct(slug, engineerId);
      const data = AddRepoSchema.parse(request.body);

      // Check global uniqueness
      const existing = await prisma.repo.findUnique({
        where: { fullName: data.fullName },
      });
      if (existing) {
        throw new Forbidden(
          `Repo "${data.fullName}" is already linked to another product`,
        );
      }

      const repo = await prisma.repo.create({
        data: { productId: product.id, ...data },
      });

      reply.status(201).send(repo);
    },
  );

  // Remove repo (OWNER/LEAD)
  app.delete(
    "/:slug/repos/:id",
    { preHandler: [requireRole("OWNER", "LEAD")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug, id } = request.params as { slug: string; id: string };
      const { engineerId } = request.productContext;
      const { product } = await resolveProduct(slug, engineerId);

      const repo = await prisma.repo.findFirst({
        where: { id, productId: product.id },
      });
      if (!repo) throw new NotFound("Repo not found");

      await prisma.repo.delete({ where: { id } });
      reply.status(204).send();
    },
  );
}
