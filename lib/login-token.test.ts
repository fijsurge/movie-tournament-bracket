import { describe, expect, it } from "vitest";
import { generateLoginToken, hashToken } from "./login-token";

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    const token = generateLoginToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashToken(generateLoginToken())).not.toBe(hashToken(generateLoginToken()));
  });

  it("never returns the plaintext token itself", () => {
    const token = generateLoginToken();
    expect(hashToken(token)).not.toBe(token);
  });
});

describe("generateLoginToken", () => {
  it("produces unique tokens", () => {
    const a = generateLoginToken();
    const b = generateLoginToken();
    expect(a).not.toBe(b);
  });
});
