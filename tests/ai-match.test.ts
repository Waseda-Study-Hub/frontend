import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeStudyMatchIntent,
  rankBuddies,
  type MatchableBuddy,
} from "../app/lib/ai-match.ts";

const buddies: MatchableBuddy[] = [
  {
    uid: "a",
    full_name: "Aiko",
    year: 2,
    major: "Computer Science",
    courses: ["Algorithms", "CSCE11"],
    availability_slots: ["Tuesday evening"],
    bio: "I prefer quiet, focused study sessions.",
  },
  {
    uid: "b",
    full_name: "Ren",
    year: 3,
    major: "Economics",
    courses: ["Statistics", "Microeconomics"],
    availability_slots: ["Friday afternoon"],
    bio: "I like collaborative group study.",
  },
  {
    uid: "c",
    full_name: "Mina",
    year: 1,
    major: "Computer Science",
    courses: ["Introduction to Programming"],
    availability_slots: ["Monday morning"],
    bio: "Beginner-friendly and happy to explain concepts.",
  },
];

test("normalizes Gemini output and removes unsupported values", () => {
  const intent = normalizeStudyMatchIntent({
    summary: "  A second-year algorithms partner  ",
    preferred_years: [2, 2, 8, "3"],
    course_terms: ["Algorithms", " algorithms ", "", 10],
    major_terms: [],
    availability_terms: [],
    preference_terms: ["quiet"],
  });

  assert.deepEqual(intent.preferred_years, [2]);
  assert.deepEqual(intent.course_terms, ["Algorithms"]);
  assert.deepEqual(intent.preference_terms, ["quiet"]);
  assert.equal(intent.summary, "A second-year algorithms partner");
});

test("keeps complete summaries up to the separate 160-character limit", () => {
  const summary =
    "Looking for study buddies taking similar courses who can meet on weekday evenings and prefer quiet, focused sessions.";
  const intent = normalizeStudyMatchIntent({
    summary,
    preferred_years: [],
    course_terms: ["Algorithms"],
    major_terms: [],
    availability_terms: ["weekday evening"],
    preference_terms: ["quiet"],
  });

  assert.equal(intent.summary, summary);
  assert.ok(intent.summary.length > 60);
});

test("ranks real profiles using weighted structured fields", () => {
  const intent = normalizeStudyMatchIntent({
    summary: "Algorithms student for quiet weekday evenings",
    preferred_years: [],
    course_terms: ["Algorithms"],
    major_terms: [],
    availability_terms: ["weekday evenings"],
    preference_terms: ["quiet"],
  });

  const ranked = rankBuddies(buddies, intent);
  assert.equal(ranked[0].buddy.uid, "a");
  assert.equal(ranked[0].score, 13);
  assert.deepEqual(ranked[0].reasons, [
    "Course: Algorithms",
    "Available: weekday evenings",
    "Preference: quiet",
  ]);
});

test("preserves backend order when no profile matches the extracted intent", () => {
  const intent = normalizeStudyMatchIntent({
    summary: "A law student",
    preferred_years: [],
    course_terms: [],
    major_terms: ["Law"],
    availability_terms: [],
    preference_terms: [],
  });

  const ranked = rankBuddies(buddies, intent);
  assert.deepEqual(
    ranked.map((result) => result.buddy.uid),
    ["a", "b", "c"],
  );
  assert.ok(ranked.every((result) => result.score === 0));
});
