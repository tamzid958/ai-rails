import type { FastifyRequest } from "fastify";
import type { MemberRole } from "@prisma/client";
import { Forbidden } from "@airails/shared";

export function requireRole(...allowed: MemberRole[]) {
  return async (request: FastifyRequest): Promise<void> => {
    if (!allowed.includes(request.productContext.role)) {
      throw new Forbidden(
        `Requires ${allowed.join(" or ")} role`,
      );
    }
  };
}
