"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProtectedPage } from "@/components/layout/protected-page";
import { ErrorState, LoadingCards } from "@/components/ui/states";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";

export default function Dashboard() {
  const { user, token } = useAuth();
  const profile = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: Boolean(user),
    queryFn: async ({ signal }) =>
      api.profile(user!.uid, await token(), signal),
  });
  const spots = useQuery({
    queryKey: ["spots"],
    queryFn: ({ signal }) => api.spots(signal),
  });
  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Your study home</span>
          <h1>
            Good to see you
            {profile.data?.username ? `, ${profile.data.username}` : ""}.
          </h1>
          <p>Pick up where you left off, without the noise.</p>
        </div>
        <div className="filters">
          <Link className="button" href="/buddies">
            Find a buddy
          </Link>
          <Link className="secondary" href="/spots">
            Explore study spots
          </Link>
        </div>
      </div>
      {!user && (
        <div className="notice">
          Firebase is not configured, so authenticated API requests cannot run.
          Explore the production interface, then add environment values to
          connect.
        </div>
      )}
      {profile.isLoading ? (
        <LoadingCards />
      ) : profile.isError ? (
        <ErrorState
          message={profile.error.message}
          retry={() => profile.refetch()}
        />
      ) : (
        <div className="grid">
          <div className="card metric">
            <span className="muted">Current courses</span>
            <strong>{profile.data?.courses.length ?? 0}</strong>
            <div className="tags">
              {profile.data?.courses.map((c) => (
                <span className="pill" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="card metric">
            <span className="muted">Study requests</span>
            <strong>—</strong>
            <p className="muted">
              Unavailable until the backend request contract is implemented.
            </p>
          </div>
          <div className="card metric">
            <span className="muted">Study spots</span>
            <strong>{spots.data?.length ?? "—"}</strong>
            <p className="muted">
              {spots.data?.length
                ? "Available in the shared directory"
                : "No recent crowd-report data"}
            </p>
          </div>
        </div>
      )}
      <section style={{ marginTop: "2rem" }}>
        <div className="page-head">
          <div>
            <span className="eyebrow">Profile</span>
            <h2>Make useful matches possible</h2>
            <p>
              Your public card only uses academic profile fields. Contact
              details are never shown in discovery.
            </p>
          </div>
          <Link href="/profile" className="secondary">
            Edit profile
          </Link>
        </div>
      </section>
    </ProtectedPage>
  );
}
