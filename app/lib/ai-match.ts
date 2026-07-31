export type StudyMatchIntent = {
  summary: string;
  preferred_years: number[];
  course_terms: string[];
  major_terms: string[];
  availability_terms: string[];
  preference_terms: string[];
};

export type MatchableBuddy = {
  uid: string;
  full_name: string;
  year: number;
  major: string;
  courses: string[];
  availability_slots: string[];
  bio?: string | null;
  match_reason?: string;
};

export type RankedBuddy<T extends MatchableBuddy> = {
  buddy: T;
  score: number;
  reasons: string[];
};

const emptyIntent: StudyMatchIntent = {
  summary: "",
  preferred_years: [],
  course_terms: [],
  major_terms: [],
  availability_terms: [],
  preference_terms: [],
};

function cleanTerm(value: unknown, maxLength = 60) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanTerms(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const terms: string[] = [];
  for (const item of value) {
    const term = cleanTerm(item);
    const key = term.toLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
    if (terms.length === limit) break;
  }
  return terms;
}

export function normalizeStudyMatchIntent(
  value: unknown,
  fallbackSummary = "",
): StudyMatchIntent {
  if (!value || typeof value !== "object") {
    return { ...emptyIntent, summary: fallbackSummary.slice(0, 160) };
  }

  const source = value as Record<string, unknown>;
  const years = Array.isArray(source.preferred_years)
    ? Array.from(
        new Set(
          source.preferred_years.filter(
            (year): year is number =>
              Number.isInteger(year) && Number(year) >= 1 && Number(year) <= 5,
          ),
        ),
      ).slice(0, 5)
    : [];

  return {
    summary:
      cleanTerm(source.summary, 160) ||
      fallbackSummary.trim().slice(0, 160),
    preferred_years: years,
    course_terms: cleanTerms(source.course_terms, 6),
    major_terms: cleanTerms(source.major_terms, 4),
    availability_terms: cleanTerms(source.availability_terms, 6),
    preference_terms: cleanTerms(source.preference_terms, 6),
  };
}

export function hasStudyMatchConstraints(intent: StudyMatchIntent) {
  return Boolean(
    intent.preferred_years.length ||
      intent.course_terms.length ||
      intent.major_terms.length ||
      intent.availability_terms.length ||
      intent.preference_terms.length,
  );
}

function normalizeForMatch(value: string) {
  const normalized = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, " ")
    .replace(/\b(weekdays|weekends|mornings|afternoons|evenings)\b/g, (term) =>
      term.slice(0, -1),
    )
    .trim();

  const inferred: string[] = [];
  if (/\b(monday|tuesday|wednesday|thursday|friday)\b/.test(normalized)) {
    inferred.push("weekday");
  }
  if (/\b(saturday|sunday)\b/.test(normalized)) inferred.push("weekend");
  return `${normalized} ${inferred.join(" ")}`.trim();
}

function matchingTerms(haystack: string, terms: string[]) {
  const normalizedHaystack = normalizeForMatch(haystack);
  const haystackTokens = new Set(normalizedHaystack.split(" ").filter(Boolean));
  return terms.filter((term) => {
    const normalizedTerm = normalizeForMatch(term);
    const termTokens = normalizedTerm.split(" ").filter(Boolean);
    return (
      normalizedTerm.length > 0 &&
      (normalizedHaystack.includes(normalizedTerm) ||
        termTokens.every((token) => haystackTokens.has(token)))
    );
  });
}

export function rankBuddies<T extends MatchableBuddy>(
  buddies: T[],
  intent: StudyMatchIntent,
): RankedBuddy<T>[] {
  return buddies
    .map((buddy, index) => {
      const reasons: string[] = [];
      let score = 0;

      if (
        intent.preferred_years.length > 0 &&
        intent.preferred_years.includes(buddy.year)
      ) {
        score += 5;
        reasons.push(buddy.year === 5 ? "Graduate student" : `Year ${buddy.year}`);
      }

      const courseMatches = matchingTerms(
        buddy.courses.join(" "),
        intent.course_terms,
      );
      score += courseMatches.length * 7;
      if (courseMatches.length) {
        reasons.push(`Course: ${courseMatches.slice(0, 2).join(", ")}`);
      }

      const majorMatches = matchingTerms(buddy.major, intent.major_terms);
      score += majorMatches.length * 5;
      if (majorMatches.length) {
        reasons.push(`Major: ${majorMatches.slice(0, 2).join(", ")}`);
      }

      const availabilityMatches = matchingTerms(
        buddy.availability_slots.join(" "),
        intent.availability_terms,
      );
      score += availabilityMatches.length * 4;
      if (availabilityMatches.length) {
        reasons.push(
          `Available: ${availabilityMatches.slice(0, 2).join(", ")}`,
        );
      }

      const preferenceMatches = matchingTerms(
        [buddy.bio, buddy.match_reason].filter(Boolean).join(" "),
        intent.preference_terms,
      );
      score += preferenceMatches.length * 2;
      if (preferenceMatches.length) {
        reasons.push(
          `Preference: ${preferenceMatches.slice(0, 2).join(", ")}`,
        );
      }

      return { buddy, score, reasons, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ buddy, score, reasons }) => ({ buddy, score, reasons }));
}
