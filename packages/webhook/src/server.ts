import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import type { HealthResponse } from "@airails/shared";

const DEFAULT_PORT = 8081;
const HOST = "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(cors);
await app.register(sensible);

app.get("/health", async (): Promise<HealthResponse> => ({
  status: "ok",
  service: "webhook",
  uptime: process.uptime(),
}));

const port = Number(process.env["WEBHOOK_PORT"]) || DEFAULT_PORT;
await app.listen({ port, host: HOST });
