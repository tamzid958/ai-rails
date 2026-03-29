import { describe, it, expect, afterEach } from "vitest";
import { validateSecrets } from "../utils.js";

describe("validateSecrets", () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it("should_pass_when_all_required_vars_are_set", () => {
    process.env.TEST_VAR = "some-value";
    expect(() => validateSecrets(["TEST_VAR"])).not.toThrow();
  });

  it("should_throw_when_required_var_is_missing", () => {
    delete process.env.MISSING_VAR;
    expect(() => validateSecrets(["MISSING_VAR"])).toThrow(
      "MISSING_VAR environment variable is required",
    );
  });

  it("should_throw_when_required_var_is_empty", () => {
    process.env.EMPTY_VAR = "";
    expect(() => validateSecrets(["EMPTY_VAR"])).toThrow(
      "EMPTY_VAR environment variable is required",
    );
  });

  it("should_reject_unsafe_defaults_in_production", () => {
    process.env.NODE_ENV = "production";
    process.env.MY_SECRET = "change-this-to-a-random-secret";
    expect(() => validateSecrets(["MY_SECRET"])).toThrow(
      "unsafe default",
    );
  });

  it("should_allow_unsafe_defaults_in_development", () => {
    process.env.NODE_ENV = "development";
    process.env.MY_SECRET = "change-this-to-a-random-secret";
    expect(() => validateSecrets(["MY_SECRET"])).not.toThrow();
  });
});
