import type { FastifyRequest } from "fastify";
import {
  API_KEY_PREFIX,
  hashApiKey,
  resolveProductFromApiKey,
  Unauthorized,
} from "@airails/shared";
import type { ProductContext } from "@airails/shared";

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

export async function authenticateRequest(
  request: FastifyRequest,
): Promise<ProductContext> {
  const token = extractBearerToken(request.headers.authorization);
  if (!token || !token.startsWith(API_KEY_PREFIX)) {
    throw new Unauthorized("Missing or invalid API key");
  }

  const hashed = hashApiKey(token);
  // resolveProductFromApiKey already updates lastUsedAt
  return resolveProductFromApiKey(hashed);
}

const SKIP_AUTH_PATHS = new Set(["/health"]);

export async function authenticateHook(request: FastifyRequest): Promise<void> {
  // request.routeOptions.url is the registered route pattern, not the raw URL
  const routePath = request.routeOptions?.url ?? request.url;
  if (SKIP_AUTH_PATHS.has(routePath)) return;
  request.productContext = await authenticateRequest(request);
}
