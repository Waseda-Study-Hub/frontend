"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedPage } from "@/components/layout/protected-page";
import { SchoolSelector } from "@/components/ui/school-selector";
import { ErrorState, LoadingCards } from "@/components/ui/states";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import { findSchool } from "@/lib/constants/schools";

export default function BuddiesPage() {
  const { token } = useAuth();
  const [school, setSchool] = useState("");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const major = findSchool(school)?.name ?? "";
  const buddies = useQuery({
    queryKey: ["buddies", major],
    enabled: Boolean(major),
    queryFn: async ({ signal }) => api.buddies(major, await token(), signal),
  });
  const shown = (buddies.data ?? []).filter((item) =>
    [item.username, item.full_name, item.bio, ...item.courses].some((v) =>
      v?.toLowerCase().includes(deferred.toLowerCase()),
    ),
  );
  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Course-aligned peers</span>
          <h1>Find a study buddy</h1>
          <p>
            Directory results contain academic profile fields only. Private
            contact details are not displayed.
          </p>
        </div>
      </div>
      <div className="card stack" style={{ marginBottom: "1rem" }}>
        <SchoolSelector
          value={school}
          onChange={setSchool}
          label="Filter by school"
        />
        <label className="field">
          Search name, course, or topic
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. microeconomics"
          />
        </label>
      </div>
      {!major ? (
        <div className="empty card">
          Choose a school to search the backend directory.
        </div>
      ) : buddies.isLoading ? (
        <LoadingCards />
      ) : buddies.isError ? (
        <ErrorState
          message={buddies.error.message}
          retry={() => buddies.refetch()}
        />
      ) : shown.length ? (
        <>
          <p className="muted">
            {shown.length} result{shown.length === 1 ? "" : "s"}
          </p>
          <div className="grid">
            {shown.map((item) => (
              <article
                className="card buddy-card"
                key={item.uid ?? item.username}
              >
                <span className="eyebrow">Year {item.year}</span>
                <h2>{item.username}</h2>
                <p>{item.major}</p>
                <div className="tags">
                  {item.courses.map((c) => (
                    <span className="pill" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
                {item.bio && <p className="muted">{item.bio}</p>}
                <button
                  className="secondary"
                  disabled
                  title="The backend does not provide study requests"
                >
                  Requests unavailable
                </button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty card">
          No students match this school and search yet.
        </div>
      )}
    </ProtectedPage>
  );
}
