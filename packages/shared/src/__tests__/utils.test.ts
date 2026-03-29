import { describe, it, expect } from "vitest";
import { hashApiKey, generateApiKey, parseCommitTrailers, estimateCost, slugify } from "../utils.js";

describe("hashApiKey", () => {
  it("should_be_deterministic", () => {
    const hash1 = hashApiKey("ar_k1_test123");
    const hash2 = hashApiKey("ar_k1_test123");
    expect(hash1).toBe(hash2);
  });

  it("should_produce_different_hashes_for_different_inputs", () => {
    const hash1 = hashApiKey("ar_k1_aaa");
    const hash2 = hashApiKey("ar_k1_bbb");
    expect(hash1).not.toBe(hash2);
  });
});

describe("generateApiKey", () => {
  it("should_produce_key_with_ar_k1_prefix", () => {
    const { raw } = generateApiKey();
    expect(raw.startsWith("ar_k1_")).toBe(true);
  });

  it("should_produce_unique_keys", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.raw).not.toBe(key2.raw);
    expect(key1.hashed).not.toBe(key2.hashed);
  });

  it("should_produce_hashable_key", () => {
    const { raw, hashed } = generateApiKey();
    expect(hashApiKey(raw)).toBe(hashed);
  });
});

describe("parseCommitTrailers", () => {
  it("should_parse_AI-Assisted-By", () => {
    const msg = "Fix bug\n\nAI-Assisted-By: copilot";
    const trailers = parseCommitTrailers(msg);
    expect(trailers["AI-Assisted-By"]).toBe("copilot");
  });

  it("should_parse_multiple_trailers", () => {
    const msg = "Add feature\n\nAI-Assisted-By: cursor\nAI-Task-Type: code-review";
    const trailers = parseCommitTrailers(msg);
    expect(trailers["AI-Assisted-By"]).toBe("cursor");
    expect(trailers["AI-Task-Type"]).toBe("code-review");
  });

  it("should_return_empty_for_no_trailers", () => {
    const msg = "Simple commit message";
    const trailers = parseCommitTrailers(msg);
    expect(Object.keys(trailers)).toHaveLength(0);
  });

  it("should_stop_at_blank_line", () => {
    const msg = "Title\n\nSome description\n\nAI-Assisted-By: copilot";
    const trailers = parseCommitTrailers(msg);
    expect(trailers["AI-Assisted-By"]).toBe("copilot");
  });
});

describe("estimateCost", () => {
  it("should_estimate_for_known_models", () => {
    const cost = estimateCost("gpt-4o", 1000, 500);
    expect(cost).toBeGreaterThan(0);
    // gpt-4o: input $2.5/M, output $10/M
    // (1000 * 2.5 + 500 * 10) / 1_000_000 = 0.0075
    expect(cost).toBeCloseTo(0.0075, 4);
  });

  it("should_return_0_for_unknown_models", () => {
    const cost = estimateCost("unknown-model", 1000, 500);
    expect(cost).toBe(0);
  });

  it("should_prefer_actual_cost_from_litellm", () => {
    const cost = estimateCost("gpt-4o", 1000, 500, 0.042);
    expect(cost).toBe(0.042);
  });

  it("should_fall_back_to_estimate_when_actual_is_zero", () => {
    const cost = estimateCost("gpt-4o", 1000, 500, 0);
    expect(cost).toBeCloseTo(0.0075, 4);
  });

  it("should_strip_provider_prefix_for_lookup", () => {
    const cost = estimateCost("openai/gpt-4o", 1000, 500);
    expect(cost).toBeCloseTo(0.0075, 4);
  });

  it("should_fuzzy_match_model_names", () => {
    const cost = estimateCost("claude-sonnet-4-6-20250620", 1000, 500);
    expect(cost).toBeGreaterThan(0);
  });
});

describe("slugify", () => {
  it("should_convert_to_lowercase_kebab_case", () => {
    expect(slugify("My Product Name")).toBe("my-product-name");
  });

  it("should_strip_leading_and_trailing_hyphens", () => {
    expect(slugify("--test--")).toBe("test");
  });
});
