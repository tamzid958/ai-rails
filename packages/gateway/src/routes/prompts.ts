import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, Forbidden, NotFound } from "@airails/shared";
import { requireRole } from "../auth/role-guard.js";
import { z } from "zod";

const CreatePromptSchema = z.object({
  taskType: z.string().min(1),
  name: z.string().min(1).max(200),
  content: z.string().min(1),
  isBase: z.boolean().default(true),
  parentId: z.string().uuid().nullish(),
});

export async function promptRoutes(app: FastifyInstance): Promise<void> {
  // List templates for this product
  app.get("/prompts", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.productContext;

    const templates = await prisma.promptTemplate.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: {
        engineer: { select: { id: true, name: true, email: true } },
      },
    });

    reply.send({ items: templates, total: templates.length, cursor: null });
  });

  // Create template
  app.post("/prompts", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId, engineerId, role } = request.productContext;
    const data = CreatePromptSchema.parse(request.body);

    // Base templates require OWNER/LEAD
    if (data.isBase && role === "MEMBER") {
      throw new Forbidden("Requires OWNER or LEAD role to create base templates");
    }

    const template = await prisma.promptTemplate.create({
      data: {
        productId,
        taskType: data.taskType,
        name: data.name,
        content: data.content,
        isBase: data.isBase,
        parentId: data.parentId ?? null,
        engineerId: data.isBase ? null : engineerId,
      },
    });

    reply.status(201).send(template);
  });

  // Promote override to base (LEAD/OWNER)
  app.post(
    "/prompts/:id/promote",
    { preHandler: [requireRole("OWNER", "LEAD")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { productId } = request.productContext;

      const template = await prisma.promptTemplate.findFirst({
        where: { id, productId },
      });
      if (!template) throw new NotFound("Template not found");

      if (template.isBase) {
        throw new Forbidden("Template is already a base template");
      }

      // Find and archive existing base template for same task type
      await prisma.promptTemplate.updateMany({
        where: { productId, taskType: template.taskType, isBase: true },
        data: { isBase: false },
      });

      const promoted = await prisma.promptTemplate.update({
        where: { id },
        data: {
          isBase: true,
          engineerId: null,
          version: { increment: 1 },
        },
      });

      reply.send(promoted);
    },
  );
}
