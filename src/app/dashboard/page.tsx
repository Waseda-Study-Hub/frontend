"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, MapPin, Sparkles, Users } from "lucide-react";
import { ProtectedPage } from "@/components/layout/protected-page";
import { ApiError, api } from "@/lib/api/client";
import { useAuth } from "@/features/auth/auth-provider";

function crowdLabel(
  latest:
    | {
        status: string;
        reported_at: string;
        freshness: "fresh" | "recent" | "stale";
        report_count?: number;
      }
    | null
    | undefined,
) {
  if (!latest || latest.freshness === "stale") return "No recent report";
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(latest.reported_at).getTime()) / 60_000),
  );
  return `${latest.status} · reported ${minutes} min ago`;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const enabled = Boolean(user?.emailVerified);
  const profile = useQuery({
    queryKey: ["profile", user?.uid],
    enabled,
    retry: false,
    queryFn: async ({ signal }) => api.profile((await token())!, signal),
  });
  const incoming = useQuery({
    queryKey: ["requests", user?.uid, "incoming"],
    enabled,
    queryFn: async ({ signal }) =>
      api.requests("incoming", (await token())!, undefined, signal),
  });
  const sent = useQuery({
    queryKey: ["requests", user?.uid, "sent"],
    enabled,
    queryFn: async ({ signal }) =>
      api.requests("sent", (await token())!, undefined, signal),
  });
  const connected = useQuery({
    queryKey: ["requests", user?.uid, "connected"],
    enabled,
    queryFn: async ({ signal }) =>
      api.requests("connected", (await token())!, undefined, signal),
  });
  const spots = useQuery({
    queryKey: ["spots", user?.uid, "dashboard"],
    enabled,
    queryFn: async ({ signal }) => api.spots({}, (await token())!, signal),
  });

  const onboarding =
    profile.error instanceof ApiError && profile.error.status === 404;
  const pendingIncoming =
    incoming.data?.items.filter((item) => item.status === "pending").length ??
    0;
  const pendingSent =
    sent.data?.items.filter((item) => item.status === "pending").length ?? 0;
  const countLabel = (count: number, nextCursor: string | null | undefined) =>
    nextCursor ? `${count}+` : String(count);
  const loading =
    profile.isLoading ||
    incoming.isLoading ||
    sent.isLoading ||
    connected.isLoading ||
    spots.isLoading;

  return (
    <ProtectedPage>
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Your study home</span>
          <h1>
            {profile.data?.nickname
              ? `Hello, ${profile.data.nickname}.`
              : "Welcome to Study Hub."}
          </h1>
          <p>What are we focusing on today?</p>
          <div className="hero-actions">
            <Link className="button" href="/buddies">
              <Users aria-hidden="true" /> Find a study buddy
            </Link>
            <Link className="secondary" href="/spots">
              <MapPin aria-hidden="true" /> Explore study spots
            </Link>
          </div>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <Sparkles />
        </div>
      </section>

      {loading ? (
        <div className="dashboard-grid" aria-label="Loading dashboard">
          <div className="card skeleton-block" />
          <div className="card skeleton-block" />
          <div className="card skeleton-block wide" />
        </div>
      ) : onboarding ? (
        <section className="card onboarding-card">
          <div className="status-icon">
            <BookOpen aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">First visit</span>
            <h2>Start with your academic profile</h2>
            <p>
              Add up to three courses and your study preferences so other
              students can find useful overlap.
            </p>
          </div>
          <Link className="button" href="/profile">
            Build my profile <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : profile.isError ? (
        <section className="card error-panel" role="alert">
          <h2>We couldn’t load your study home</h2>
          <p>{profile.error.message}</p>
          <button className="secondary" onClick={() => profile.refetch()}>
            Try again
          </button>
        </section>
      ) : (
        <div className="dashboard-grid">
          <section className="card dashboard-card buddies-card">
            <div className="section-title">
              <div>
                <span className="eyebrow">Your study buddies</span>
                <h2>Keep connections useful</h2>
              </div>
              <Link
                href="/requests"
                className="icon-button"
                aria-label="Open requests"
              >
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="dashboard-stat-row">
              <div>
                <strong>
                  {connected.isError
                    ? "—"
                    : countLabel(
                        connected.data?.items.length ?? 0,
                        connected.data?.next_cursor,
                      )}
                </strong>
                <span>connected</span>
              </div>
              <div>
                <strong>
                  {incoming.isError
                    ? "—"
                    : countLabel(pendingIncoming, incoming.data?.next_cursor)}
                </strong>
                <span>incoming</span>
              </div>
              <div>
                <strong>
                  {sent.isError
                    ? "—"
                    : countLabel(pendingSent, sent.data?.next_cursor)}
                </strong>
                <span>sent</span>
              </div>
            </div>
            {incoming.isError || sent.isError || connected.isError ? (
              <p className="field-error">
                Request summaries are temporarily unavailable.
              </p>
            ) : pendingIncoming > 0 ? (
              <Link className="secondary" href="/requests">
                Review incoming requests
              </Link>
            ) : (
              <p className="muted">No incoming requests need attention.</p>
            )}
          </section>

          <section className="card dashboard-card course-card">
            <span className="eyebrow">Current courses</span>
            <h2>{profile.data?.courses.length ?? 0} active courses</h2>
            <div className="tags">
              {profile.data?.courses.map((course) => (
                <span className="pill" key={course}>
                  {course}
                </span>
              ))}
            </div>
            {!profile.data?.courses.length && (
              <p className="muted">Add courses to improve discovery results.</p>
            )}
            <Link className="text-link" href="/profile">
              Edit academic profile <ArrowRight aria-hidden="true" />
            </Link>
          </section>

          <section className="card dashboard-card spots-card wide">
            <div className="section-title">
              <div>
                <span className="eyebrow">Today’s study spots</span>
                <h2>Find the right atmosphere</h2>
              </div>
              <Link className="secondary" href="/spots">
                View all
              </Link>
            </div>
            {spots.isError ? (
              <div className="empty-inline">
                <p className="field-error">
                  Study spots are temporarily unavailable.
                </p>
                <button className="text-link" onClick={() => spots.refetch()}>
                  Try again
                </button>
              </div>
            ) : spots.data?.items.length ? (
              <div className="spot-preview-grid">
                {spots.data.items.slice(0, 2).map((spot) => (
                  <article className="spot-preview" key={spot.id}>
                    <div className="placeholder-art" aria-hidden="true">
                      <MapPin />
                    </div>
                    <div>
                      <h3>{spot.name}</h3>
                      <p>
                        {spot.campus} · {spot.building}
                        {spot.floor_or_location
                          ? ` · ${spot.floor_or_location}`
                          : ""}
                      </p>
                      <span className="freshness">
                        {crowdLabel(spot.latest_crowd)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-inline">
                <p>No approved study spots are available yet.</p>
                <Link href="/spots/recommend" className="text-link">
                  Recommend a place
                </Link>
              </div>
            )}
          </section>
        </div>
      )}
    </ProtectedPage>
  );
}
