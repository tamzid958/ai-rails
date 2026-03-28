import { describe, it, expect } from "vitest";
import { ProductCreateSchema } from "../types/product.js";
import { AddMemberSchema } from "../types/membership.js";
import { AiActivityCreateSchema } from "../types/ai-activity.js";
import { PrEventCreateSchema } from "../types/pr-event.js";
import { RepoCreateSchema } from "../types/repo.js";
import { ApiKeyCreateSchema } from "../types/api-key.js";

describe("ProductCreateSchema", () => {
  it("should_accept_valid_input", () => {
    const result = ProductCreateSchema.safeParse({
      name: "Test Product",
      slug: "test-product",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_invalid_slug", () => {
    const result = ProductCreateSchema.safeParse({
      name: "Test",
      slug: "INVALID SLUG!",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_empty_name", () => {
    const result = ProductCreateSchema.safeParse({
      name: "",
      slug: "valid-slug",
    });
    expect(result.success).toBe(false);
  });

  it("should_default_allowedModels_to_empty_array", () => {
    const result = ProductCreateSchema.parse({
      name: "Test",
      slug: "test",
    });
    expect(result.allowedModels).toEqual([]);
  });
});

describe("AddMemberSchema", () => {
  it("should_accept_valid_email_and_role", () => {
    const result = AddMemberSchema.safeParse({
      email: "user@example.com",
      role: "LEAD",
    });
    expect(result.success).toBe(true);
  });

  it("should_default_role_to_MEMBER", () => {
    const result = AddMemberSchema.parse({ email: "user@example.com" });
    expect(result.role).toBe("MEMBER");
  });

  it("should_reject_invalid_email", () => {
    const result = AddMemberSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });
});

describe("AiActivityCreateSchema", () => {
  it("should_accept_valid_activity", () => {
    const result = AiActivityCreateSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      engineerId: "550e8400-e29b-41d4-a716-446655440001",
      captureMethod: "GATEWAY",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_invalid_capture_method", () => {
    const result = AiActivityCreateSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      engineerId: "550e8400-e29b-41d4-a716-446655440001",
      captureMethod: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_confidence_above_1", () => {
    const result = AiActivityCreateSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      engineerId: "550e8400-e29b-41d4-a716-446655440001",
      captureMethod: "GATEWAY",
      confidence: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("PrEventCreateSchema", () => {
  it("should_accept_valid_pr_event", () => {
    const result = PrEventCreateSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      externalId: "gh-123",
      provider: "github",
      repoFullName: "org/repo",
      prNumber: 42,
      branchName: "feature/test",
    });
    expect(result.success).toBe(true);
  });

  it("should_default_status_to_OPENED", () => {
    const result = PrEventCreateSchema.parse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      externalId: "gh-123",
      provider: "github",
      repoFullName: "org/repo",
      prNumber: 42,
      branchName: "feature/test",
    });
    expect(result.status).toBe("OPENED");
  });
});

describe("RepoCreateSchema", () => {
  it("should_accept_valid_repo", () => {
    const result = RepoCreateSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "org/my-repo",
    });
    expect(result.success).toBe(true);
  });

  it("should_default_provider_to_github", () => {
    const result = RepoCreateSchema.parse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "org/my-repo",
    });
    expect(result.provider).toBe("github");
  });
});

describe("ApiKeyCreateSchema", () => {
  it("should_accept_valid_label", () => {
    const result = ApiKeyCreateSchema.safeParse({ label: "Production Key" });
    expect(result.success).toBe(true);
  });

  it("should_reject_empty_label", () => {
    const result = ApiKeyCreateSchema.safeParse({ label: "" });
    expect(result.success).toBe(false);
  });
});
