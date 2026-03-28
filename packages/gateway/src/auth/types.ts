import type { ProductContext } from "@airails/shared";

declare module "fastify" {
  interface FastifyRequest {
    productContext: ProductContext;
  }
}
