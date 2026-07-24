"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Armchair,
  CircleOff,
  MapPin,
  PlugZap,
  Search,
  Users,
  Utensils,
} from "lucide-react";
import { ProtectedPage } from "@/components/layout/protected-page";
import { ErrorState, LoadingCards } from "@/components/ui/states";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";

const campuses = ["Waseda", "Toyama", "Nishiwaseda", "Tokorozawa"];

export default function SpotsPage() {
  const { user, token } = useAuth();
  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState("");
  const [noise, setNoise] = useState("");
  const [outlets, setOutlets] = useState(false);
  const [restroom, setRestroom] = useState(false);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [foodAllowed, setFoodAllowed] = useState(false);
  const [crowdedness, setCrowdedness] = useState("");
  const deferredQuery = useDeferredValue(query);
  const filters = useMemo(
    () => ({
      q: deferredQuery || undefined,
      campus: campus || undefined,
      noise_level: noise || undefined,
      outlets: outlets || undefined,
      nearby_restroom: restroom || undefined,
      private_room: privateRoom || undefined,
      food_allowed: foodAllowed || undefined,
      crowdedness: crowdedness || undefined,
      limit: 20,
    }),
    [
      campus,
      crowdedness,
      deferredQuery,
      foodAllowed,
      noise,
      outlets,
      privateRoom,
      restroom,
    ],
  );
  const spots = useInfiniteQuery({
    queryKey: ["spots", user?.uid, filters],
    enabled: Boolean(user?.emailVerified),
    initialPageParam: "",
    queryFn: async ({ pageParam, signal }) =>
      api.spots(
        { ...filters, cursor: pageParam || undefined },
        (await token())!,
        signal,
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const items = spots.data?.pages.flatMap((page) => page.items) ?? [];
  const activeCount = [
    query,
    campus,
    noise,
    outlets,
    restroom,
    privateRoom,
    foodAllowed,
    crowdedness,
  ].filter(Boolean).length;
  const clear = () => {
    setQuery("");
    setCampus("");
    setNoise("");
    setOutlets(false);
    setRestroom(false);
    setPrivateRoom(false);
    setFoodAllowed(false);
    setCrowdedness("");
  };

  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Campus spaces</span>
          <h1>Find your study spot</h1>
          <p>
            Browse approved public contributions and choose the atmosphere and
            amenities you need.
          </p>
        </div>
        <Link href="/spots/recommend" className="button">
          Recommend a spot
        </Link>
      </div>

      <section className="filter-panel" aria-label="Study spot filters">
        <div className="filter-heading">
          <strong>
            Filters {activeCount ? `· ${activeCount} active` : ""}
          </strong>
          <button
            className="text-button"
            disabled={!activeCount}
            onClick={clear}
          >
            Clear all
          </button>
        </div>
        <div className="spot-filter-grid">
          <label className="search-input">
            <Search aria-hidden="true" />
            <span className="sr-only">Search study spots</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Spot or building"
            />
          </label>
          <label className="field">
            Campus
            <select value={campus} onChange={(e) => setCampus(e.target.value)}>
              <option value="">All campuses</option>
              {campuses.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Noise level
            <select value={noise} onChange={(e) => setNoise(e.target.value)}>
              <option value="">Any noise level</option>
              <option value="quiet">Quiet</option>
              <option value="moderate">Moderate</option>
              <option value="lively">Lively</option>
            </select>
          </label>
          <label className="field">
            Crowdedness
            <select
              value={crowdedness}
              onChange={(e) => setCrowdedness(e.target.value)}
            >
              <option value="">Any recent report</option>
              <option value="quiet">Quiet</option>
              <option value="moderate">Moderate</option>
              <option value="busy">Busy</option>
              <option value="full">Full</option>
            </select>
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={outlets}
              onChange={(e) => setOutlets(e.target.checked)}
            />
            <PlugZap aria-hidden="true" /> Outlets
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={restroom}
              onChange={(e) => setRestroom(e.target.checked)}
            />
            <MapPin aria-hidden="true" /> Restroom nearby
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={privateRoom}
              onChange={(e) => setPrivateRoom(e.target.checked)}
            />
            <Users aria-hidden="true" /> Private room
          </label>
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={foodAllowed}
              onChange={(e) => setFoodAllowed(e.target.checked)}
            />
            <Utensils aria-hidden="true" /> Food allowed
          </label>
        </div>
      </section>

      {spots.isLoading ? (
        <LoadingCards />
      ) : spots.isError ? (
        <ErrorState
          message={spots.error.message}
          retry={() => spots.refetch()}
        />
      ) : items.length ? (
        <>
          <p className="muted result-line">
            {items.length} approved public spot
            {items.length === 1 ? "" : "s"}
          </p>
          <div className="grid two spot-grid">
            {items.map((spot) => (
              <article className="card spot-card" key={spot.id}>
                <div className="spot-art" aria-hidden="true">
                  <MapPin />
                  <span>Community-contributed location</span>
                </div>
                <div className="spot-content">
                  <span className="eyebrow">{spot.campus} campus</span>
                  <h2>{spot.name}</h2>
                  <p className="spot-location">
                    {spot.building}
                    {spot.floor_or_location
                      ? ` · ${spot.floor_or_location}`
                      : ""}
                  </p>
                  <p className="muted clamp">{spot.description}</p>
                  <div className="amenity-grid">
                    <span>
                      <CircleOff aria-hidden="true" /> {spot.noise_level}
                    </span>
                    <span>
                      <PlugZap aria-hidden="true" />{" "}
                      {spot.has_outlets ? "Outlets" : "No outlets listed"}
                    </span>
                    <span>
                      <Armchair aria-hidden="true" />{" "}
                      {spot.has_private_room ? "Private room" : "Open seating"}
                    </span>
                    <span>
                      <Utensils aria-hidden="true" />{" "}
                      {spot.food_allowed ? "Food allowed" : "No food"}
                    </span>
                  </div>
                  <div className="spot-footer">
                    <span className="freshness">
                      {spot.latest_crowd &&
                      spot.latest_crowd.freshness !== "stale"
                        ? `${spot.latest_crowd.status} · recent report`
                        : "No recent report"}
                    </span>
                    <Link className="secondary" href={`/spots/${spot.id}`}>
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {spots.hasNextPage && (
            <div className="load-more">
              <button
                className="secondary"
                disabled={spots.isFetchingNextPage}
                onClick={() => spots.fetchNextPage()}
              >
                {spots.isFetchingNextPage
                  ? "Loading…"
                  : "Load more study spots"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state card">
          <MapPin aria-hidden="true" />
          <h2>No public spots match</h2>
          <p>Try clearing a filter or contribute a verified campus location.</p>
          <button className="secondary" onClick={clear}>
            Clear all filters
          </button>
        </div>
      )}
    </ProtectedPage>
  );
}
