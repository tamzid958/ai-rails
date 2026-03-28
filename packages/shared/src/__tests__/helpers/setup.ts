import { afterAll } from "vitest";
import { prisma } from "../../db.js";
import { cleanupAll } from "./test-factory.js";

afterAll(async () => {
  await cleanupAll();
  await prisma.$disconnect();
});
