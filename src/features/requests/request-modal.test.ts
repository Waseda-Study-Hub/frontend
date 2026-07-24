import { describe, expect, it } from "vitest";
import { requestFormSchema } from "./request-modal";

describe("study-request form validation", () => {
  it("accepts a message, optional topic, and selected contact method", () => {
    expect(
      requestFormSchema.safeParse({
        topic: "Microeconomics",
        message: "Would you like to review the problem set together?",
        contact_methods: ["waseda_email"],
      }).success,
    ).toBe(true);
  });

  it("rejects a message shorter than ten characters", () => {
    const result = requestFormSchema.safeParse({
      topic: "",
      message: "Too short",
      contact_methods: ["waseda_email"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["message"]);
    }
  });

  it("rejects a request with no post-acceptance contact method", () => {
    const result = requestFormSchema.safeParse({
      topic: "",
      message: "This message is long enough.",
      contact_methods: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["contact_methods"]);
    }
  });

  it("enforces the backend-consistent 500-character message limit", () => {
    const base = {
      topic: "",
      contact_methods: ["waseda_email"],
    };

    expect(
      requestFormSchema.safeParse({ ...base, message: "a".repeat(500) })
        .success,
    ).toBe(true);
    expect(
      requestFormSchema.safeParse({ ...base, message: "a".repeat(501) })
        .success,
    ).toBe(false);
  });
});
