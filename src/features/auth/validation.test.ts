import { describe, expect, it } from "vitest";
import { isAllowedEmail, mapAuthError } from "./validation";
describe("student email validation", () => {
  it("accepts configured Waseda domains", () =>
    expect(isAllowedEmail("student@fuji.waseda.jp")).toBe(true));
  it("rejects lookalikes", () =>
    expect(isAllowedEmail("student@fuji.waseda.jp.example.com")).toBe(false));
});
it("maps Firebase errors safely", () => {
  expect(mapAuthError("auth/invalid-credential")).toContain("incorrect");
  expect(mapAuthError("unknown")).toContain("failed");
});
