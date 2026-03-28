import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../db.js";
import { resolveProductFromApiKey, resolveProductFromRepo } from "../product-context.js";
import { hashApiKey } from "../utils.js";
import {
  createTestProduct,
  createTestEngineer,
  createTestRepo,
  cleanupAll,
} from "./helpers/test-factory.js";

afterAll(async () => {
  await cleanupAll();
  await prisma.$disconnect();
});

describe("resolveProductFromApiKey", () => {
  let productId: string;
  let apiKey: string;

  beforeAll(async () => {
    const product = await createTestProduct("Context Test Product");
    productId = product.id;
    const result = await createTestEngineer(productId, "MEMBER");
    apiKey = result.apiKey;
  });

  it("should_return_correct_product_for_valid_key", async () => {
    const hashed = hashApiKey(apiKey);
    const ctx = await resolveProductFromApiKey(hashed);
    expect(ctx.productId).toBe(productId);
  });

  it("should_return_correct_role", async () => {
    const hashed = hashApiKey(apiKey);
    const ctx = await resolveProductFromApiKey(hashed);
    expect(ctx.role).toBe("MEMBER");
  });

  it("should_throw_for_revoked_key", async () => {
    // Create an engineer and then revoke the key
    const product = await createTestProduct("Revoked Key Product");
    const { apiKey: revokedKey } = await createTestEngineer(product.id);
    const hashed = hashApiKey(revokedKey);

    // Revoke the key
    await prisma.apiKey.update({
      where: { key: hashed },
      data: { isActive: false },
    });

    await expect(resolveProductFromApiKey(hashed)).rejects.toThrow(
      "Invalid or revoked API key",
    );
  });

  it("should_throw_for_non_member", async () => {
    // Create engineer in one product, then remove membership
    const product = await createTestProduct("Non-member Product");
    const { engineer, apiKey: key } = await createTestEngineer(product.id);
    const hashed = hashApiKey(key);

    // Remove membership but keep the key
    await prisma.productMembership.deleteMany({
      where: { productId: product.id, engineerId: engineer.id },
    });

    await expect(resolveProductFromApiKey(hashed)).rejects.toThrow(
      "Not a member of this product",
    );
  });
});

describe("resolveProductFromRepo", () => {
  let productId: string;
  let repoFullName: string;

  beforeAll(async () => {
    const product = await createTestProduct("Repo Test Product");
    productId = product.id;
    const repo = await createTestRepo(productId, "org/test-repo-ctx");
    repoFullName = repo.fullName;
  });

  it("should_return_product_for_linked_repo", async () => {
    const result = await resolveProductFromRepo(repoFullName);
    expect(result.productId).toBe(productId);
  });

  it("should_throw_for_unlinked_repo", async () => {
    await expect(
      resolveProductFromRepo("org/nonexistent-repo"),
    ).rejects.toThrow("not linked");
  });
});
