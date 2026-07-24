"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import Image from "next/image";
import {
  getFirebaseClient,
  getPublicRuntimeConfig,
} from "./lib/firebase";
import { isAllowedWasedaEmail } from "./lib/waseda-auth";

type Buddy = {
  uid: string;
  username: string;
  full_name: string;
  year: number;
  major: string;
  courses: string[];
  availability_slots: string[];
  bio?: string | null;
  instagram_tag?: string | null;
  match_reason?: string;
};

type StudySpot = {
  id: string;
  name: string;
  location: string;
  description: string;
  labels: string[];
  added_by: string;
  is_public: boolean;
};

type ProfileForm = {
  fullName: string;
  year: string;
  major: string;
  courses: string;
  bio: string;
  instagram: string;
};

const emptyProfile: ProfileForm = {
  fullName: "",
  year: "1",
  major: "",
  courses: "",
  bio: "",
  instagram: "",
};

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>Waseda Study Hub</span>
    </span>
  );
}

function GoogleIcon() {
  return (
    <span className="google-icon" aria-hidden="true">
      G
    </span>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [view, setView] = useState<"buddies" | "spots" | "profile">(
    "buddies",
  );
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [query, setQuery] = useState("");
  const [spotFilter, setSpotFilter] = useState("All");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const runtimeConfig = await getPublicRuntimeConfig();
        if (!active) return;
        setApiBaseUrl(runtimeConfig.apiBaseUrl.replace(/\/$/, ""));

        const client = await getFirebaseClient();
        if (!active) return;
        if (!client) {
          setAuthLoading(false);
          return;
        }

        unsubscribe = client.onAuthStateChanged(
          client.auth,
          async (next) => {
            if (!active) return;

            if (next?.email && !isAllowedWasedaEmail(next.email)) {
              await client.signOut(client.auth);
              setUser(null);
              setAuthError("Use an official Waseda email address.");
              setAuthLoading(false);
              return;
            }

            setUser(next);
            setAuthLoading(false);
            if (next) {
              setProfile((current) => ({
                ...current,
                fullName: next.displayName ?? current.fullName,
              }));
            }
          },
        );

        await client.getRedirectResult(client.auth);
      } catch {
        if (active) {
          setAuthError("Google sign-in did not finish. Please try again.");
          setAuthLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (user) void loadPrivateData(user);
    // loadPrivateData intentionally follows the authenticated user and API URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, apiBaseUrl]);

  const filteredBuddies = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return buddies;
    return buddies.filter((buddy) =>
      [
        buddy.full_name,
        buddy.major,
        buddy.match_reason,
        ...buddy.courses,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [buddies, query]);

  const spotLabels = useMemo(
    () => [
      "All",
      ...Array.from(new Set(spots.flatMap((spot) => spot.labels))).slice(0, 5),
    ],
    [spots],
  );

  const filteredSpots =
    spotFilter === "All"
      ? spots
      : spots.filter((spot) => spot.labels.includes(spotFilter));

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  async function authorizedFetch(path: string, init?: RequestInit) {
    if (!user || !apiBaseUrl) {
      throw new Error("The backend URL is not configured.");
    }
    const token = await user.getIdToken();
    return fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
  }

  async function loadPrivateData(activeUser: User) {
    if (!apiBaseUrl) {
      setAuthError(
        "Google sign-in is ready. Add the deployed backend URL to load private data.",
      );
      return;
    }

    setDataLoading(true);
    setAuthError("");
    try {
      const token = await activeUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const profileResponse = await fetch(
        `${apiBaseUrl}/users/${activeUser.uid}`,
        { headers },
      );

      if (profileResponse.status === 404) {
        setProfileMissing(true);
        setView("profile");
        setSpots([]);
        setBuddies([]);
        return;
      }
      if (!profileResponse.ok) throw new Error("Could not load your profile.");

      const profileData = await profileResponse.json();
      setProfileMissing(false);
      setProfile({
        fullName: profileData.full_name ?? activeUser.displayName ?? "",
        year: String(profileData.year ?? 1),
        major: profileData.major ?? "",
        courses: (profileData.courses ?? []).join(", "),
        bio: profileData.bio ?? "",
        instagram: profileData.instagram_tag ?? "",
      });

      const [buddyResponse, spotResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/buddies/recommend/${activeUser.uid}`, { headers }),
        fetch(`${apiBaseUrl}/study-spots/`, { headers }),
      ]);
      if (!buddyResponse.ok || !spotResponse.ok) {
        throw new Error("Could not load the Study Hub.");
      }
      setBuddies(await buddyResponse.json());
      setSpots(await spotResponse.json());
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Could not load the Study Hub.",
      );
    } finally {
      setDataLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setAuthError("");
    const client = await getFirebaseClient();
    if (!client) {
      setAuthError(
        "Firebase sign-in needs the project’s web configuration first.",
      );
      return;
    }
    client.provider.setCustomParameters({
      prompt: "select_account",
      hd: "waseda.jp",
    });
    await client.signInWithRedirect(client.auth, client.provider);
  }

  async function handleSignOut() {
    const client = await getFirebaseClient();
    if (client) await client.signOut(client.auth);
    setUser(null);
    setBuddies([]);
    setSpots([]);
    setView("buddies");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setDataLoading(true);
    try {
      const response = await authorizedFetch(`/users/${user.uid}`, {
        method: "POST",
        body: JSON.stringify({
          username: user.email?.split("@")[0] ?? user.uid,
          full_name: profile.fullName,
          year: Number(profile.year),
          major: profile.major,
          courses: profile.courses
            .split(",")
            .map((course) => course.trim())
            .filter(Boolean),
          availability_slots: [],
          bio: profile.bio || null,
          instagram_tag: profile.instagram || null,
        }),
      });
      if (!response.ok) throw new Error("Could not save your profile.");
      setProfileMissing(false);
      setView("buddies");
      showToast("Profile saved.");
      await loadPrivateData(user);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Could not save your profile.",
      );
    } finally {
      setDataLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="landing">
        <header className="public-header">
          <a href="#top" aria-label="Waseda Study Hub home">
            <Brand />
          </a>
          <nav aria-label="Landing page navigation">
            <a href="#study-buddies">Study Buddy</a>
            <a href="#study-spots">Study Spot</a>
          </nav>
          <button
            className="landing-login"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
          >
            Log in
          </button>
        </header>

        <section className="public-hero" id="top">
          <div className="hero-panel">
            <h1>Waseda Study Hub</h1>
            <p>Study better, together at Waseda.</p>
            <div className="hero-actions">
              <a className="button primary" href="#study-buddies">
                Study Buddy
              </a>
              <a className="button secondary" href="#study-spots">
                Study Spot
              </a>
            </div>
          </div>
          {authError && <p className="form-error hero-error">{authError}</p>}
        </section>

        <section className="landing-feature" id="study-buddies">
          <div className="landing-feature-copy">
            <p className="eyebrow">Study Buddy</p>
            <h2>Find a Study Buddy</h2>
            <p>Connect by major and course.</p>
            <button
              className="button primary"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
            >
              Find a Buddy
            </button>
          </div>
          <Image
            className="landing-photo"
            src="/study-buddies.jpg"
            alt="Illustration of students studying together"
            width={1200}
            height={900}
            priority
          />
        </section>

        <section className="landing-feature reverse" id="study-spots">
          <Image
            className="landing-photo"
            src="/study-spots.jpg"
            alt="Illustration of a modern university library"
            width={1200}
            height={900}
          />
          <div className="landing-feature-copy">
            <p className="eyebrow">Study Spot</p>
            <h2>Explore Study Spots</h2>
            <p>Browse quiet and group-friendly spaces around campus.</p>
            <button
              className="button primary"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
            >
              Find a Spot
            </button>
          </div>
        </section>

        <section className="landing-values" aria-label="Why Waseda Study Hub">
          <article>
            <h3>Built for Waseda</h3>
            <p>Verified university email access.</p>
          </article>
          <article>
            <h3>Two focused tools</h3>
            <p>Study buddies and study spots.</p>
          </article>
          <article>
            <h3>Private by default</h3>
            <p>Member details stay behind sign-in.</p>
          </article>
        </section>

        <footer className="simple-footer">
          <div className="footer-left">
            <Brand />
            <nav aria-label="Footer navigation">
              <a href="#study-buddies">Study Buddy</a>
              <a href="#study-spots">Study Spot</a>
            </nav>
          </div>
          <button
            className="google-button"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </footer>
      </main>
    );
  }

  const initial =
    user.displayName?.trim().charAt(0).toUpperCase() ??
    user.email?.charAt(0).toUpperCase() ??
    "W";

  return (
    <main className="app-shell">
      <header className="app-header">
        <Brand />
        <nav aria-label="Study Hub navigation">
          <button
            className={view === "buddies" ? "active" : ""}
            onClick={() => setView("buddies")}
            disabled={profileMissing}
          >
            Study buddies
          </button>
          <button
            className={view === "spots" ? "active" : ""}
            onClick={() => setView("spots")}
            disabled={profileMissing}
          >
            Study spots
          </button>
        </nav>
        <div className="account-menu">
          <button
            className={`account-button ${view === "profile" ? "active" : ""}`}
            onClick={() => setView("profile")}
            aria-label="Open profile"
          >
            {initial}
          </button>
          <button className="signout-button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="dashboard-heading">
        <p className="eyebrow">Waseda Study Hub</p>
        <h1>
          {view === "buddies"
            ? "Study buddies"
            : view === "spots"
              ? "Study spots"
              : "Your profile"}
        </h1>
      </section>

      {authError && (
        <div className="dashboard-alert" role="alert">
          {authError}
        </div>
      )}

      {dataLoading && (
        <div className="loading-panel" role="status">
          Loading…
        </div>
      )}

      {!dataLoading && view === "profile" && (
        <section className="profile-panel">
          <div className="panel-copy">
            <p className="eyebrow">
              {profileMissing ? "Set up required" : "Account"}
            </p>
            <h2>
              {profileMissing ? "Create your profile." : "Update your profile."}
            </h2>
            <p>
              Your major and courses are used to find relevant study buddies.
            </p>
          </div>
          <form className="profile-form" onSubmit={saveProfile}>
            <label>
              Full name
              <input
                required
                value={profile.fullName}
                onChange={(event) =>
                  setProfile({ ...profile, fullName: event.target.value })
                }
              />
            </label>
            <div className="form-row">
              <label>
                Year
                <select
                  value={profile.year}
                  onChange={(event) =>
                    setProfile({ ...profile, year: event.target.value })
                  }
                >
                  <option value="1">1st year</option>
                  <option value="2">2nd year</option>
                  <option value="3">3rd year</option>
                  <option value="4">4th year</option>
                  <option value="5">Graduate</option>
                </select>
              </label>
              <label>
                Major
                <input
                  required
                  value={profile.major}
                  onChange={(event) =>
                    setProfile({ ...profile, major: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Current courses
              <input
                required
                value={profile.courses}
                onChange={(event) =>
                  setProfile({ ...profile, courses: event.target.value })
                }
                placeholder="CSCE11, STAT01"
              />
              <small>Separate courses with commas.</small>
            </label>
            <label>
              Short bio
              <textarea
                value={profile.bio}
                onChange={(event) =>
                  setProfile({ ...profile, bio: event.target.value })
                }
                rows={3}
              />
            </label>
            <label>
              Instagram (optional)
              <input
                value={profile.instagram}
                onChange={(event) =>
                  setProfile({ ...profile, instagram: event.target.value })
                }
                placeholder="@username"
              />
            </label>
            <button className="button primary" type="submit">
              Save profile
            </button>
          </form>
        </section>
      )}

      {!dataLoading && view === "buddies" && !profileMissing && (
        <section className="private-panel">
          <div className="private-toolbar">
            <label className="private-search">
              <span>Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Course, major, or name"
              />
            </label>
            <p>{filteredBuddies.length} matches</p>
          </div>
          {filteredBuddies.length ? (
            <div className="private-grid">
              {filteredBuddies.map((buddy) => (
                <article className="private-card buddy" key={buddy.uid}>
                  <div className="card-profile">
                    <span className="profile-initial">
                      {buddy.full_name?.charAt(0) || "W"}
                    </span>
                    <div>
                      <h2>{buddy.full_name}</h2>
                      <p>
                        Year {buddy.year} · {buddy.major}
                      </p>
                    </div>
                  </div>
                  <p className="match-reason">{buddy.match_reason}</p>
                  <div className="tag-row">
                    {buddy.courses.map((course) => (
                      <span key={course}>{course}</span>
                    ))}
                  </div>
                  {buddy.bio && <p className="card-description">{buddy.bio}</p>}
                  <button
                    className="outline-button"
                    onClick={() =>
                      showToast(
                        buddy.instagram_tag
                          ? `Contact: ${buddy.instagram_tag}`
                          : "This student has not shared contact details.",
                      )
                    }
                  >
                    Contact
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-private">
              <h2>No matches yet.</h2>
              <p>Try another search or update your courses.</p>
            </div>
          )}
        </section>
      )}

      {!dataLoading && view === "spots" && !profileMissing && (
        <section className="private-panel">
          <div className="private-toolbar">
            <div className="filter-pills">
              {spotLabels.map((label) => (
                <button
                  key={label}
                  className={spotFilter === label ? "active" : ""}
                  onClick={() => setSpotFilter(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p>{filteredSpots.length} spots</p>
          </div>
          {filteredSpots.length ? (
            <div className="private-grid spots">
              {filteredSpots.map((spot) => (
                <article className="private-card spot" key={spot.id}>
                  <div className="spot-shape" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <p className="location-label">{spot.location}</p>
                  <h2>{spot.name}</h2>
                  <p className="card-description">{spot.description}</p>
                  <div className="tag-row">
                    {spot.labels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-private">
              <h2>No spots in this category.</h2>
              <p>Choose another filter.</p>
            </div>
          )}
        </section>
      )}

      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </main>
  );
}
