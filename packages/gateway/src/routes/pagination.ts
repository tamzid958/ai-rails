import type { FastifyRequest } from "fastify";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

interface PaginationParams {
  cursor: string | undefined;
  limit: number;
}

export function parsePagination(request: FastifyRequest): PaginationParams {
  const query = request.query as Record<string, string | undefined>;
  const rawLimit = Number(query["limit"]) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const cursor = query["cursor"] || undefined;
  return { cursor, limit };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  cursor: string | null;
}
