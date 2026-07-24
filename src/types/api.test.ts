import { describe, expect, it } from "vitest";
import {
  profileInputSchema,
  publicProfileSchema,
  studySpotInputSchema,
} from "./api";

const validProfile = {
  nickname: "Haru",
  full_name: "",
  school_id: "ug-pse-en",
  year: 2,
  courses: ["Microeconomics", "Statistics"],
  study_focus: "Microeconomics",
  study_styles: ["quiet_study"] as const,
  study_language: "english" as const,
  contacts: {
    waseda_email: "haru@fuji.waseda.jp",
    instagram: "",
    discord: "",
    line: "",
  },
  public_bio: "Preparing for finals.",
};

describe("profile form schema", () => {
  it("accepts a complete academic profile", () => {
    expect(profileInputSchema.safeParse(validProfile).success).toBe(true);
  });

  it("enforces the three-course product limit", () => {
    const result = profileInputSchema.safeParse({
      ...validProfile,
      courses: ["One", "Two", "Three", "Four"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["courses"]);
    }
  });

  it("requires a school, study focus, and at least one study style", () => {
    const result = profileInputSchema.safeParse({
      ...validProfile,
      school_id: "",
      study_focus: "",
      study_styles: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(({ path }) => path[0])).toEqual(
        expect.arrayContaining(["school_id", "study_focus", "study_styles"]),
      );
    }
  });

  it("validates a supplied contact email", () => {
    const result = profileInputSchema.safeParse({
      ...validProfile,
      contacts: {
        ...validProfile.contacts,
        waseda_email: "not-an-email",
      },
    });

    expect(result.success).toBe(false);
  });

  it("uses the backend OpenAPI study-style enum values", () => {
    expect(
      profileInputSchema.safeParse({
        ...validProfile,
        study_styles: ["quiet-study"],
      }).success,
    ).toBe(false);
    expect(
      profileInputSchema.safeParse({
        ...validProfile,
        study_styles: ["quiet_study"],
      }).success,
    ).toBe(true);
  });
});

describe("privacy-safe public profiles", () => {
  it("does not carry private contact or legal-name fields into UI data", () => {
    const parsed = publicProfileSchema.parse({
      uid: "student-2",
      nickname: "Aoi",
      school_id: "ug-sils-en",
      year: 3,
      courses: ["Academic Writing"],
      study_styles: ["active_discussion"],
      study_language: "bilingual",
      public_bio: null,
      full_name: "Private Legal Name",
      contacts: { line: "private-line-id" },
      email: "private@fuji.waseda.jp",
    });

    expect(parsed).not.toHaveProperty("full_name");
    expect(parsed).not.toHaveProperty("contacts");
    expect(parsed).not.toHaveProperty("email");
  });
});

describe("study-spot contribution schema", () => {
  const validSpot = {
    name: "Building 3 Study Commons",
    campus: "Waseda",
    building: "Building 3",
    floor_or_location: "2F",
    description: "A quiet shared study area near the central staircase.",
    noise_level: "quiet" as const,
    has_outlets: true,
    has_nearby_restroom: true,
    has_private_room: false,
    food_allowed: false,
    visibility: "public" as const,
  };

  it("accepts a complete contribution", () => {
    expect(studySpotInputSchema.safeParse(validSpot).success).toBe(true);
  });

  it("rejects short descriptions and missing building details", () => {
    const result = studySpotInputSchema.safeParse({
      ...validSpot,
      building: "",
      description: "Too short",
    });

    expect(result.success).toBe(false);
  });
});
