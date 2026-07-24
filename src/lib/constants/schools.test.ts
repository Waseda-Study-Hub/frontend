import { describe, expect, it } from "vitest";
import { findSchool, SCHOOLS } from "./schools";
describe("school catalogue", () => {
  it("has 33 unique stable IDs", () => {
    expect(SCHOOLS).toHaveLength(33);
    expect(new Set(SCHOOLS.map((school) => school.id)).size).toBe(33);
  });
  it("makes duplicate abbreviations unambiguous", () => {
    expect(
      SCHOOLS.filter((school) => school.abbreviation === "FSE"),
    ).toHaveLength(2);
    expect(findSchool("ug-fse-en")?.level).toBe("undergraduate");
  });
});
