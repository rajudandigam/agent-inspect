import { describe, expect, it } from "vitest";

import { redact } from "../src/index.js";

const TOKEN_URL =
  "https://app.example.com/orders/5f2b9a1c-0d3e-4d1a-9b7e-2c1f4a6b8d90/checkout?token=abcdef1234567890&step=2";

describe("url-aware redaction", () => {
  it("keeps host and path when a query param carries a credential", () => {
    const result = redact({ url: TOKEN_URL }, { profile: "share" });

    expect(result.value).toEqual({
      url: "https://app.example.com/orders/[id]/checkout?token=[REDACTED]&step=2",
    });
    expect(result.findings.map((finding) => finding.detector)).toContain(
      "value.urlCredential",
    );
  });

  it("removes userinfo credentials", () => {
    const result = redact(
      { pageUrl: "https://admin:hunter2pass@internal.example.com/dash" },
      { profile: "share" },
    );

    expect(result.value).toEqual({ pageUrl: "https://internal.example.com/dash" });
  });

  it("redacts credential params in the fragment", () => {
    const result = redact(
      {
        redirect:
          "https://app.example.com/cb?step=3#access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      },
      { profile: "share" },
    );

    expect(result.value).toEqual({
      redirect: "https://app.example.com/cb?step=3#access_token=[REDACTED]",
    });
  });

  it("leaves path identifiers alone under the local profile", () => {
    const result = redact({ url: TOKEN_URL }, { profile: "local" });

    expect(result.value).toEqual({
      url: "https://app.example.com/orders/5f2b9a1c-0d3e-4d1a-9b7e-2c1f4a6b8d90/checkout?token=[REDACTED]&step=2",
    });
  });

  it("masks numeric and opaque path identifiers under share", () => {
    const result = redact(
      {
        url: "https://app.example.com/users/9284713/sessions/a1b2c3d4e5f6a7b8c9d0/view",
      },
      { profile: "share" },
    );

    expect(result.value).toEqual({
      url: "https://app.example.com/users/[id]/sessions/[id]/view",
    });
  });

  it("keeps short path words that are not identifiers", () => {
    const result = redact(
      { url: "https://app.example.com/v2/orders/new?tab=1" },
      { profile: "share" },
    );

    expect(result.value).toEqual({
      url: "https://app.example.com/v2/orders/new?tab=1",
    });
  });

  it("lets two attempts on the same page compare equal", () => {
    const first = redact(
      {
        url: "https://app.example.com/orders/5f2b9a1c-0d3e-4d1a-9b7e-2c1f4a6b8d90/checkout?token=first1234567890",
      },
      { profile: "share" },
    );
    const second = redact(
      {
        url: "https://app.example.com/orders/7c1e4b2a-9f8d-4c3b-8a2e-1d0f3b5c7e91/checkout?token=second1234567890",
      },
      { profile: "share" },
    );

    expect(first.value).toEqual({
      url: "https://app.example.com/orders/[id]/checkout?token=[REDACTED]",
    });
    expect(first.value).toEqual(second.value);
  });

  it("still replaces the whole value when a credential survives in the path", () => {
    const result = redact(
      {
        url: "https://app.example.com/callback/eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      },
      { profile: "share" },
    );

    expect(result.value).toEqual({ url: "[REDACTED]" });
  });

  it("still replaces a URL held under a sensitive key", () => {
    const result = redact(
      { authorization: "https://app.example.com/x?step=1" },
      { profile: "share" },
    );

    expect(result.value).toEqual({ authorization: "[REDACTED]" });
  });

  it("leaves non-url strings untouched", () => {
    const result = redact(
      { note: "retry on the checkout page", count: 3 },
      { profile: "share" },
    );

    expect(result.value).toEqual({ note: "retry on the checkout page", count: 3 });
    expect(result.redacted).toBe(false);
  });
});
