import { describe, expect, it } from "vitest";
import { isAllowedEmail, mapAuthError } from "./validation";

describe("student email validation", () => {
  it.each([
    "student@fuji.waseda.jp",
    "student@suou.waseda.jp",
    "  STUDENT@FUJI.WASEDA.JP  ",
  ])("accepts an exact configured Waseda domain: %s", (email) => {
    expect(isAllowedEmail(email)).toBe(true);
  });

  it.each([
    "student@fuji.waseda.jp.example.com",
    "student@notfuji.waseda.jp",
    "student@waseda.jp",
    "student@fuji.waseda.jp@evil.example",
    "student",
    "",
  ])("rejects a missing or lookalike domain: %s", (email) => {
    expect(isAllowedEmail(email)).toBe(false);
  });
});

describe("Firebase error mapping", () => {
  it.each([
    ["auth/invalid-credential", "incorrect"],
    ["auth/email-already-in-use", "already"],
    ["auth/too-many-requests", "Too many"],
    ["auth/network-request-failed", "connection"],
  ])("maps %s to a safe message", (code, expected) => {
    expect(mapAuthError(code)).toContain(expected);
  });

  it("does not expose an unknown Firebase error code", () => {
    const unknownCode = "auth/internal-error-secret-detail";
    const message = mapAuthError(unknownCode);

    expect(message).toContain("failed");
    expect(message).not.toContain(unknownCode);
  });
});
