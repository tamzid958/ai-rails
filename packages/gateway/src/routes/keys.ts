import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, ApiKeyCreateSchema, NotFound } from "@airails/shared";
import { generateApiKey } from "@airails/shared";

export async function keyRoutes(app: FastifyInstance): Promise<void> {
  // Create key for this product
  app.post("/keys", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId, engineerId } = request.productContext;
    const data = ApiKeyCreateSchema.parse(request.body);

    const { raw, hashed } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        key: hashed,
        label: data.label,
        engineerId,
        productId,
      },
    });

    reply.status(201).send({
      id: apiKey.id,
      key: raw,
      label: apiKey.label,
      createdAt: apiKey.createdAt,
    });
  });

  // List keys for this product (this engineer only)
  app.get("/keys", async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId, engineerId } = request.productContext;

    const keys = await prisma.apiKey.findMany({
      where: { productId, engineerId },
      select: {
        id: true,
        label: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    reply.send({ items: keys, total: keys.length, cursor: null });
  });

  // Revoke key (own keys only)
  app.delete("/keys/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { productId, engineerId } = request.productContext;

    const key = await prisma.apiKey.findFirst({
      where: { id, productId, engineerId },
    });
    if (!key) throw new NotFound("API key not found");

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    reply.status(204).send();
  });
}
