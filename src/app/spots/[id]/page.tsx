"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Armchair,
  MapPin,
  PlugZap,
  RefreshCw,
  Utensils,
} from "lucide-react";
import { ProtectedPage } from "@/components/layout/protected-page";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";

const crowdOptions = [
  ["quiet", "Quiet"],
  ["moderate", "Moderate"],
  ["busy", "Busy"],
  ["full", "Full"],
] as const;

export default function SpotDetailsPage() {
  const params = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const client = useQueryClient();
  const spot = useQuery({
    queryKey: ["spot", user?.uid, params.id],
    enabled: Boolean(user?.emailVerified && params.id),
    queryFn: async ({ signal }) =>
      api.spot(params.id, (await token())!, signal),
  });
  const report = useMutation({
    mutationFn: async (value: "quiet" | "moderate" | "busy" | "full") =>
      api.reportCrowd(params.id, value, (await token())!),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["spot", user?.uid, params.id] });
      client.invalidateQueries({ queryKey: ["spots", user?.uid] });
    },
  });

  return (
    <ProtectedPage>
      <Link href="/spots" className="text-link back-link">
        <ArrowLeft aria-hidden="true" /> Back to study spots
      </Link>
      {spot.isLoading ? (
        <div className="card skeleton-block" />
      ) : spot.isError ? (
        <div className="card error-panel" role="alert">
          <h1>We couldn’t load this spot</h1>
          <p>{spot.error.message}</p>
          <button className="secondary" onClick={() => spot.refetch()}>
            Try again
          </button>
        </div>
      ) : spot.data ? (
        <>
          <section className="spot-detail-hero">
            <div className="spot-art large" aria-hidden="true">
              <MapPin />
              <span>Community-contributed location</span>
            </div>
            <div>
              <span className="eyebrow">{spot.data.campus} campus</span>
              <h1>{spot.data.name}</h1>
              <p className="spot-location">
                {spot.data.building}
                {spot.data.floor_or_location
                  ? ` · ${spot.data.floor_or_location}`
                  : ""}
              </p>
              <p>{spot.data.description}</p>
            </div>
          </section>
          <div className="detail-grid">
            <section className="card">
              <span className="eyebrow">Practical details</span>
              <h2>What to expect</h2>
              <div className="detail-list">
                <span>
                  <RefreshCw aria-hidden="true" />
                  Noise level: {spot.data.noise_level}
                </span>
                <span>
                  <PlugZap aria-hidden="true" />
                  {spot.data.has_outlets
                    ? "Electrical outlets available"
                    : "No outlets listed"}
                </span>
                <span>
                  <Armchair aria-hidden="true" />
                  {spot.data.has_private_room
                    ? "Private room available"
                    : "Open seating"}
                </span>
                <span>
                  <Utensils aria-hidden="true" />
                  {spot.data.food_allowed
                    ? "Food is allowed"
                    : "Food is not allowed"}
                </span>
                <span>
                  <MapPin aria-hidden="true" />
                  {spot.data.has_nearby_restroom
                    ? "Restroom nearby"
                    : "No restroom information"}
                </span>
              </div>
            </section>
            <section className="card">
              <span className="eyebrow">Crowdedness</span>
              <h2>
                {spot.data.latest_crowd &&
                spot.data.latest_crowd.freshness !== "stale"
                  ? spot.data.latest_crowd.status
                  : "No recent report"}
              </h2>
              <p className="muted">
                {spot.data.latest_crowd
                  ? `Reported ${new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(spot.data.latest_crowd.reported_at))}`
                  : "Help other students with a quick current report."}
              </p>
              <fieldset>
                <legend className="label">Report current crowdedness</legend>
                <div className="segmented">
                  {crowdOptions.map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      disabled={report.isPending}
                      onClick={() => report.mutate(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {report.isSuccess && (
                <p className="success" role="status">
                  Current report added.
                </p>
              )}
              {report.error && (
                <p className="field-error" role="alert">
                  {report.error.message}
                </p>
              )}
            </section>
          </div>
        </>
      ) : null}
    </ProtectedPage>
  );
}
