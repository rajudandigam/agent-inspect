import { describe, expect, it } from "vitest";

import {
  isCredentialSensitiveKey,
  normalizeSensitiveKey,
} from "../src/safety/sensitive-key.js";

describe("normalizeSensitiveKey (compound forms)", () => {
  it("maps camelCase / kebab / dot / snake / SCREAMING to the same snake form", () => {
    expect(normalizeSensitiveKey("userPassword")).toBe("user_password");
    expect(normalizeSensitiveKey("user_password")).toBe("user_password");
    expect(normalizeSensitiveKey("user-password")).toBe("user_password");
    expect(normalizeSensitiveKey("user.password")).toBe("user_password");
    expect(normalizeSensitiveKey("USER_PASSWORD")).toBe("user_password");
    expect(normalizeSensitiveKey("clientSecret")).toBe("client_secret");
    expect(normalizeSensitiveKey("maxTokens")).toBe("max_tokens");
    expect(normalizeSensitiveKey("tokenLimit")).toBe("token_limit");
  });
});

describe("isCredentialSensitiveKey (6.14.2-5 / #239)", () => {
  it("does not flag token configuration fields", () => {
    for (const key of [
      "ls_max_tokens",
      "max_tokens",
      "min_tokens",
      "token_count",
      "token_limit",
      "input_tokens",
      "output_tokens",
      "tokens",
      "maxTokens",
      "tokenLimit",
      "maxOutputTokens",
    ]) {
      expect(isCredentialSensitiveKey(key), key).toBe(false);
    }
  });

  it("flags credential token keys", () => {
    for (const key of [
      "token",
      "access_token",
      "refresh_token",
      "idToken",
      "accessToken",
      "authorization",
      "api_key",
      "password",
    ]) {
      expect(isCredentialSensitiveKey(key), key).toBe(true);
    }
  });

  it("flags compound credential / PII keys across separator styles", () => {
    for (const key of [
      "password",
      "userPassword",
      "user_password",
      "user-password",
      "user.password",
      "USER_PASSWORD",
      "clientSecret",
      "client_secret",
      "client-secret",
      "userEmail",
      "user_email",
      "sessionCookie",
      "session_cookie",
    ]) {
      expect(isCredentialSensitiveKey(key), key).toBe(true);
    }
  });

  it("does not key-match camelCase topic fields that should use value detectors", () => {
    for (const key of ["emailNote", "passwordPolicy"]) {
      expect(isCredentialSensitiveKey(key), key).toBe(false);
    }
  });

  it("still key-matches explicit-separator prefix compounds", () => {
    expect(isCredentialSensitiveKey("email_note")).toBe(true);
    expect(isCredentialSensitiveKey("password_policy")).toBe(true);
  });
});
