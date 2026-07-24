import { describe, expect, it } from "vitest";
import { findSchool, SCHOOLS } from "./schools";

describe("school catalogue", () => {
  it("has 33 unique stable IDs", () => {
    expect(SCHOOLS).toHaveLength(33);
    expect(new Set(SCHOOLS.map((school) => school.id)).size).toBe(33);
  });

  it("contains only the supported levels and program languages", () => {
    expect(new Set(SCHOOLS.map((school) => school.level))).toEqual(
      new Set(["undergraduate", "graduate", "professional"]),
    );
    expect(new Set(SCHOOLS.map((school) => school.programLanguage))).toEqual(
      new Set(["english-based", "japanese-taught"]),
    );
  });

  it("makes duplicate abbreviations unambiguous", () => {
    expect(
      SCHOOLS.filter((school) => school.abbreviation === "FSE"),
    ).toHaveLength(2);
    expect(findSchool("ug-fse-en")?.level).toBe("undergraduate");
  });

  it("resolves both stable IDs and canonical backend names", () => {
    const school = SCHOOLS.find(({ id }) => id === "grad-gsaps-en");

    expect(findSchool("grad-gsaps-en")).toEqual(school);
    expect(findSchool(school?.name)).toEqual(school);
    expect(findSchool("missing-school")).toBeUndefined();
  });
});
