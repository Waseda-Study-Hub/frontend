"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Filter, Search, X } from "lucide-react";
import { ProtectedPage } from "@/components/layout/protected-page";
import { SchoolSelector } from "@/components/ui/school-selector";
import { ErrorState, LoadingCards } from "@/components/ui/states";
import { useAuth } from "@/features/auth/auth-provider";
import { api, type BuddyFilters } from "@/lib/api/client";
import { findSchool } from "@/lib/constants/schools";
import type { PublicProfile } from "@/types/api";
import { RequestModal } from "@/features/requests/request-modal";

const styleOptions = [
  ["", "Any study style"],
  ["quiet_study", "Quiet Study"],
  ["active_discussion", "Active Discussion"],
  ["morning_person", "Morning Person"],
  ["afternoon_person", "Afternoon Person"],
  ["evening_night", "Evening / Night"],
  ["group_study", "Group Study"],
  ["one_on_one", "1-on-1 Study"],
] as const;
const studyStyleIds = new Set<string>(styleOptions.map(([id]) => id));
const languageIds = new Set(["english", "japanese", "bilingual"]);
const yearIds = new Set(["1", "2", "3", "4", "5", "6", "7", "8"]);

export default function BuddiesPage() {
  const { user, token } = useAuth();
  const [query, setQuery] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [year, setYear] = useState("");
  const [studyStyle, setStudyStyle] = useState("");
  const [language, setLanguage] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);
  const [recipient, setRecipient] = useState<PublicProfile | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSchool = params.get("school_id") ?? "";
    const initialYear = params.get("year") ?? "";
    const initialStyle = params.get("study_style") ?? "";
    const initialLanguage = params.get("study_language") ?? "";

    setQuery((params.get("q") ?? "").slice(0, 100));
    setSchoolId(findSchool(initialSchool)?.id ?? "");
    setYear(yearIds.has(initialYear) ? initialYear : "");
    setStudyStyle(studyStyleIds.has(initialStyle) ? initialStyle : "");
    setLanguage(languageIds.has(initialLanguage) ? initialLanguage : "");
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const apiFilters: BuddyFilters = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      school_id: schoolId || undefined,
      year: year || undefined,
      study_style: studyStyle || undefined,
      study_language: language || undefined,
      limit: 18,
    }),
    [debouncedQuery, language, schoolId, studyStyle, year],
  );
  const urlFilters: BuddyFilters = useMemo(
    () => ({
      q: query.trim() || undefined,
      school_id: schoolId || undefined,
      year: year || undefined,
      study_style: studyStyle || undefined,
      study_language: language || undefined,
    }),
    [language, query, schoolId, studyStyle, year],
  );

  useEffect(() => {
    if (!filtersReady) return;
    const params = new URLSearchParams();
    Object.entries(urlFilters).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );
  }, [filtersReady, urlFilters]);

  const buddies = useInfiniteQuery({
    queryKey: ["buddies", user?.uid, apiFilters],
    enabled: Boolean(user?.emailVerified && filtersReady),
    initialPageParam: "",
    queryFn: async ({ pageParam, signal }) =>
      api.buddies(
        { ...apiFilters, cursor: pageParam || undefined },
        (await token())!,
        signal,
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const sent = useQuery({
    queryKey: ["requests", user?.uid, "sent"],
    enabled: Boolean(user?.emailVerified),
    queryFn: async ({ signal }) =>
      api.requests("sent", (await token())!, undefined, signal),
  });

  const people = buddies.data?.pages.flatMap((page) => page.items) ?? [];
  const pendingRecipientIds = new Set(
    (sent.data?.items ?? [])
      .filter((request) => request.status === "pending")
      .map((request) => request.recipient.uid),
  );
  const activeCount = [query, schoolId, year, studyStyle, language].filter(
    Boolean,
  ).length;
  const clearAll = () => {
    setQuery("");
    setSchoolId("");
    setYear("");
    setStudyStyle("");
    setLanguage("");
  };

  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Course-aligned peers</span>
          <h1>Find a study buddy</h1>
          <p>
            Search by course or topic and choose a study style that works for
            you. Public cards never include contact details.
          </p>
        </div>
        <span className="status-badge">
          {people.length} student{people.length === 1 ? "" : "s"}
        </span>
      </div>

      <section className="filter-panel" aria-label="Buddy filters">
        <div className="filter-heading">
          <span>
            <Filter aria-hidden="true" /> Filters
            {activeCount > 0 && (
              <span className="filter-count">{activeCount}</span>
            )}
          </span>
          <button
            className="text-button"
            onClick={clearAll}
            disabled={!activeCount}
          >
            Clear all
          </button>
        </div>
        <div className="filter-grid">
          <label className="search-input">
            <Search aria-hidden="true" />
            <span className="sr-only">Search by course or topic</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Course, topic, or nickname"
              maxLength={100}
            />
          </label>
          <SchoolSelector
            value={schoolId}
            onChange={setSchoolId}
            label="School / faculty"
          />
          <label className="field">
            Year
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Any year</option>
              <option value="1">1st year</option>
              <option value="2">2nd year</option>
              <option value="3">3rd year</option>
              <option value="4">4th year</option>
              <option value="5">Graduate — 1st year</option>
              <option value="6">Graduate — 2nd year</option>
              <option value="7">Graduate — 3rd year</option>
              <option value="8">Graduate — 4th year or later</option>
            </select>
          </label>
          <label className="field">
            Study style
            <select
              value={studyStyle}
              onChange={(e) => setStudyStyle(e.target.value)}
            >
              {styleOptions.map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">Any language</option>
              <option value="english">English</option>
              <option value="japanese">Japanese</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </label>
        </div>
        {activeCount > 0 && (
          <div className="active-filters" aria-label="Active filters">
            {query && (
              <button onClick={() => setQuery("")}>
                “{query}” <X aria-hidden="true" />
              </button>
            )}
            {schoolId && (
              <button onClick={() => setSchoolId("")}>
                {findSchool(schoolId)?.abbreviation ?? schoolId}{" "}
                <X aria-hidden="true" />
              </button>
            )}
            {year && (
              <button onClick={() => setYear("")}>
                Year {year} <X aria-hidden="true" />
              </button>
            )}
            {studyStyle && (
              <button onClick={() => setStudyStyle("")}>
                {styleOptions.find(([id]) => id === studyStyle)?.[1]}{" "}
                <X aria-hidden="true" />
              </button>
            )}
            {language && (
              <button onClick={() => setLanguage("")}>
                {language} <X aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </section>

      {buddies.isLoading ? (
        <LoadingCards />
      ) : buddies.isError ? (
        <ErrorState
          message={buddies.error.message}
          retry={() => buddies.refetch()}
        />
      ) : people.length ? (
        <>
          <div className="grid buddy-grid">
            {people.map((person) => {
              const pending = pendingRecipientIds.has(person.uid);
              const school = findSchool(person.school_id);
              return (
                <article className="card buddy-card" key={person.uid}>
                  <div className="buddy-topline">
                    <span className="avatar" aria-hidden="true">
                      {person.nickname.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="status-dot">Public academic profile</span>
                  </div>
                  <h2>{person.nickname}</h2>
                  <p className="muted">
                    {school?.abbreviation ?? person.school_id} · Year{" "}
                    {person.year}
                  </p>
                  {person.match_reason && (
                    <p className="match-reason">{person.match_reason}</p>
                  )}
                  <div className="tags">
                    {person.courses.map((course) => (
                      <span className="pill" key={course}>
                        {course}
                      </span>
                    ))}
                  </div>
                  <div className="card-meta">
                    <span>{person.study_language}</span>
                    <span>{person.study_styles.length} study preferences</span>
                  </div>
                  {person.public_bio && (
                    <p className="muted clamp">{person.public_bio}</p>
                  )}
                  <button
                    className={pending ? "secondary" : "button"}
                    disabled={pending}
                    onClick={() => setRecipient(person)}
                  >
                    {pending ? "Request pending" : "Request study"}
                  </button>
                </article>
              );
            })}
          </div>
          {buddies.hasNextPage && (
            <div className="load-more">
              <button
                className="secondary"
                disabled={buddies.isFetchingNextPage}
                onClick={() => buddies.fetchNextPage()}
              >
                {buddies.isFetchingNextPage ? "Loading…" : "Load more students"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state card">
          <Search aria-hidden="true" />
          <h2>No study buddies found</h2>
          <p>Try clearing a filter or searching for a broader topic.</p>
          <button className="secondary" onClick={clearAll}>
            Clear all filters
          </button>
        </div>
      )}

      <RequestModal
        recipient={recipient}
        open={Boolean(recipient)}
        onClose={() => setRecipient(null)}
      />
    </ProtectedPage>
  );
}
