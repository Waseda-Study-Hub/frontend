"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedPage } from "@/components/layout/protected-page";
import { ErrorState, LoadingCards } from "@/components/ui/states";
import { api } from "@/lib/api/client";

export default function SpotsPage() {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const spots = useQuery({
    queryKey: ["spots"],
    queryFn: ({ signal }) => api.spots(signal),
  });
  const allLabels = Array.from(
    new Set((spots.data ?? []).flatMap((s) => s.labels)),
  ).sort();
  const shown = (spots.data ?? []).filter(
    (s) =>
      (!query ||
        `${s.name} ${s.location}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!label || s.labels.includes(label)),
  );
  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Campus spaces</span>
          <h1>Study spots</h1>
          <p>
            Practical, community-contributed locations. No stock imagery is
            presented as a real campus place.
          </p>
        </div>
        <Link href="/spots/recommend" className="button">
          Recommend a spot
        </Link>
      </div>
      <div className="filters">
        <input
          aria-label="Search spots"
          placeholder="Search spot or building"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter by amenity"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        >
          <option value="">All amenities</option>
          {allLabels.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {spots.isLoading ? (
        <LoadingCards />
      ) : spots.isError ? (
        <ErrorState
          message={spots.error.message}
          retry={() => spots.refetch()}
        />
      ) : shown.length ? (
        <div className="grid two">
          {shown.map((s) => (
            <article className="card spot-card" key={s.id ?? s.name}>
              <span className="eyebrow">
                {s.is_public ? "Shared location" : "Private contribution"}
              </span>
              <h2>{s.name}</h2>
              <p>
                <b>{s.location}</b>
              </p>
              <p className="muted">{s.description}</p>
              <div className="tags">
                {s.labels.map((x) => (
                  <span className="pill" key={x}>
                    {x}
                  </span>
                ))}
              </div>
              <p className="muted">No recent crowd report</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty card">No study spots match these filters.</div>
      )}
    </ProtectedPage>
  );
}
