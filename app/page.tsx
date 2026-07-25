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

type StudySpotForm = {
  name: string;
  location: string;
  description: string;
  labels: string;
};

type ContactModal = {
  name: string;
  instagram: string | null;
};

const emptyProfile: ProfileForm = {
  fullName: "",
  year: "1",
  major: "",
  courses: "",
  bio: "",
  instagram: "",
};

const emptyStudySpot: StudySpotForm = {
  name: "",
  location: "",
  description: "",
  labels: "",
};

const demoUpvoteStorageKey = "waseda-study-hub-demo-upvotes";

function getSpotKey(spot: StudySpot) {
  return spot.id || `${spot.name}:${spot.location}`;
}

function getDemoUpvoteCount(spot: StudySpot) {
  const value = getSpotKey(spot);
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash, 31) + value.charCodeAt(index);
  }
  return ((hash >>> 0) % 20) + 1;
}

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
  const [spotForm, setSpotForm] = useState<StudySpotForm>(emptyStudySpot);
  const [spotFormOpen, setSpotFormOpen] = useState(false);
  const [buddyFiltersOpen, setBuddyFiltersOpen] = useState(false);
  const [buddyNameQuery, setBuddyNameQuery] = useState("");
  const [buddyYear, setBuddyYear] = useState("All");
  const [buddyMajorQuery, setBuddyMajorQuery] = useState("");
  const [buddyCourseQuery, setBuddyCourseQuery] = useState("");
  const [spotFiltersOpen, setSpotFiltersOpen] = useState(false);
  const [spotNameQuery, setSpotNameQuery] = useState("");
  const [spotLocationQuery, setSpotLocationQuery] = useState("");
  const [spotFilter, setSpotFilter] = useState("All");
  const [contactModal, setContactModal] = useState<ContactModal | null>(null);
  const [upvotedSpots, setUpvotedSpots] = useState<Record<string, boolean>>({});
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
      } catch {
        if (active) {
          setAuthError("Could not start Google sign-in. Please try again.");
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(
          window.localStorage.getItem(demoUpvoteStorageKey) ?? "[]",
        );
        if (!Array.isArray(saved)) return;
        setUpvotedSpots(
          Object.fromEntries(
            saved
              .filter(
                (value: unknown): value is string => typeof value === "string",
              )
              .map((value) => [value, true]),
          ),
        );
      } catch {
        window.localStorage.removeItem(demoUpvoteStorageKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!contactModal) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setContactModal(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [contactModal]);

  const filteredBuddies = useMemo(() => {
    const nameTerm = buddyNameQuery.trim().toLowerCase();
    const majorTerm = buddyMajorQuery.trim().toLowerCase();
    const courseTerm = buddyCourseQuery.trim().toLowerCase();

    return buddies.filter((buddy) => {
      const matchesName =
        !nameTerm ||
        buddy.full_name.toLowerCase().includes(nameTerm) ||
        buddy.username.toLowerCase().includes(nameTerm);
      const matchesYear =
        buddyYear === "All" || String(buddy.year) === buddyYear;
      const matchesMajor =
        !majorTerm || buddy.major.toLowerCase().includes(majorTerm);
      const matchesCourse =
        !courseTerm ||
        buddy.courses.some((course) =>
          course.toLowerCase().includes(courseTerm),
        );

      return matchesName && matchesYear && matchesMajor && matchesCourse;
    });
  }, [
    buddies,
    buddyCourseQuery,
    buddyMajorQuery,
    buddyNameQuery,
    buddyYear,
  ]);

  const buddyYears = useMemo(
    () =>
      Array.from(new Set(buddies.map((buddy) => buddy.year))).sort(
        (a, b) => a - b,
      ),
    [buddies],
  );

  const buddyFilterCount = [
    buddyNameQuery.trim(),
    buddyYear === "All" ? "" : buddyYear,
    buddyMajorQuery.trim(),
    buddyCourseQuery.trim(),
  ].filter(Boolean).length;

  const spotLabels = useMemo(() => {
    const labels = new Map<string, string>();
    spots.flatMap((spot) => spot.labels).forEach((rawLabel) => {
      const label = rawLabel.trim();
      if (!label) return;
      const key = label.toLowerCase();
      if (!labels.has(key)) labels.set(key, label);
    });
    return Array.from(labels.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [spots]);

  const filteredSpots = useMemo(() => {
    const nameTerm = spotNameQuery.trim().toLowerCase();
    const locationTerm = spotLocationQuery.trim().toLowerCase();
    const labelTerm = spotFilter.toLowerCase();

    return spots.filter((spot) => {
      const matchesName =
        !nameTerm || spot.name.toLowerCase().includes(nameTerm);
      const matchesLocation =
        !locationTerm || spot.location.toLowerCase().includes(locationTerm);
      const matchesLabel =
        spotFilter === "All" ||
        spot.labels.some((label) => label.toLowerCase() === labelTerm);

      return matchesName && matchesLocation && matchesLabel;
    });
  }, [spots, spotFilter, spotLocationQuery, spotNameQuery]);

  const spotFilterCount = [
    spotNameQuery.trim(),
    spotLocationQuery.trim(),
    spotFilter === "All" ? "" : spotFilter,
  ].filter(Boolean).length;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function upvoteSpot(spot: StudySpot) {
    const key = getSpotKey(spot);
    setUpvotedSpots((current) => {
      if (current[key]) return current;
      const next = { ...current, [key]: true };
      try {
        window.localStorage.setItem(
          demoUpvoteStorageKey,
          JSON.stringify(Object.keys(next)),
        );
      } catch {
        // The demo upvote still works for this page when storage is unavailable.
      }
      return next;
    });
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
    try {
      const client = await getFirebaseClient();
      if (!client) {
        setAuthError(
          "Firebase sign-in needs the project’s web configuration first.",
        );
        return;
      }

      client.provider.setCustomParameters({ prompt: "select_account" });
      const result = await client.signInWithPopup(
        client.auth,
        client.provider,
      );
      const email = result.user.email ?? "";

      if (!isAllowedWasedaEmail(email)) {
        await client.signOut(client.auth);
        setAuthError("Use an official Waseda email address.");
      }
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/popup-closed-by-user") return;
      if (code === "auth/popup-blocked") {
        setAuthError(
          "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
        );
        return;
      }
      setAuthError("Google sign-in did not finish. Please try again.");
    }
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

  async function submitStudySpot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setDataLoading(true);
    setAuthError("");
    try {
      const response = await authorizedFetch("/study-spots/", {
        method: "POST",
        body: JSON.stringify({
          name: spotForm.name.trim(),
          location: spotForm.location.trim(),
          description: spotForm.description.trim(),
          labels: spotForm.labels
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean)
            .slice(0, 8),
          added_by: user.uid,
          is_public: true,
        }),
      });
      if (!response.ok) throw new Error("Could not submit the study spot.");

      setSpotForm(emptyStudySpot);
      setSpotFormOpen(false);
      showToast("Study spot submitted.");
      await loadPrivateData(user);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Could not submit the study spot.",
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
            alt="Waseda University library study space"
            width={1471}
            height={828}
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
          <form
            className="profile-form buddy-profile-form"
            onSubmit={saveProfile}
          >
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
                maxLength={200}
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
          <div className="private-toolbar filter-toolbar">
            <div className="filter-summary">
              <span>Study buddy results</span>
              <strong>{filteredBuddies.length} matches</strong>
            </div>
            <button
              className={`filter-toggle ${
                buddyFiltersOpen || buddyFilterCount ? "active" : ""
              }`}
              type="button"
              onClick={() => setBuddyFiltersOpen((current) => !current)}
              aria-expanded={buddyFiltersOpen}
              aria-controls="buddy-filters"
            >
              Filters{buddyFilterCount ? ` (${buddyFilterCount})` : ""}
              <span aria-hidden="true">{buddyFiltersOpen ? "−" : "+"}</span>
            </button>
          </div>
          {buddyFiltersOpen && (
            <section
              className="expanded-filters"
              id="buddy-filters"
              aria-label="Study buddy filters"
            >
              <div className="filter-fields buddy-filter-fields">
                <label>
                  Name
                  <input
                    value={buddyNameQuery}
                    onChange={(event) =>
                      setBuddyNameQuery(event.target.value)
                    }
                    placeholder="Search name"
                  />
                </label>
                <label>
                  Year
                  <select
                    value={buddyYear}
                    onChange={(event) => setBuddyYear(event.target.value)}
                  >
                    <option value="All">All years</option>
                    {buddyYears.map((year) => (
                      <option key={year} value={year}>
                        {year === 5 ? "Graduate" : `Year ${year}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Major
                  <input
                    value={buddyMajorQuery}
                    onChange={(event) =>
                      setBuddyMajorQuery(event.target.value)
                    }
                    placeholder="Search major"
                  />
                </label>
                <label>
                  Course
                  <input
                    value={buddyCourseQuery}
                    onChange={(event) =>
                      setBuddyCourseQuery(event.target.value)
                    }
                    placeholder="Search course"
                  />
                </label>
              </div>
              <button
                className="clear-filter-button"
                type="button"
                onClick={() => {
                  setBuddyNameQuery("");
                  setBuddyYear("All");
                  setBuddyMajorQuery("");
                  setBuddyCourseQuery("");
                }}
                disabled={!buddyFilterCount}
              >
                Clear filters
              </button>
            </section>
          )}
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
                      setContactModal({
                        name: buddy.full_name,
                        instagram: buddy.instagram_tag ?? null,
                      })
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
          <div className="private-toolbar filter-toolbar">
            <div className="filter-summary">
              <span>Study spot results</span>
              <strong>{filteredSpots.length} spots</strong>
            </div>
            <div className="spot-toolbar-actions">
              <button
                className={`filter-toggle ${
                  spotFiltersOpen || spotFilterCount ? "active" : ""
                }`}
                type="button"
                onClick={() => setSpotFiltersOpen((current) => !current)}
                aria-expanded={spotFiltersOpen}
                aria-controls="spot-filters"
              >
                Filters{spotFilterCount ? ` (${spotFilterCount})` : ""}
                <span aria-hidden="true">{spotFiltersOpen ? "−" : "+"}</span>
              </button>
              <button
                className="button primary compact-button"
                type="button"
                onClick={() => setSpotFormOpen((current) => !current)}
                aria-expanded={spotFormOpen}
              >
                {spotFormOpen ? "Cancel" : "Suggest a spot"}
              </button>
            </div>
          </div>
          {spotFiltersOpen && (
            <section
              className="expanded-filters"
              id="spot-filters"
              aria-label="Study spot filters"
            >
              <div className="filter-fields spot-filter-fields">
                <label>
                  Spot name
                  <input
                    value={spotNameQuery}
                    onChange={(event) =>
                      setSpotNameQuery(event.target.value)
                    }
                    placeholder="Search spot name"
                  />
                </label>
                <label>
                  Location
                  <input
                    value={spotLocationQuery}
                    onChange={(event) =>
                      setSpotLocationQuery(event.target.value)
                    }
                    placeholder="Building, campus, or area"
                  />
                </label>
              </div>
              <div className="filter-label-section">
                <p>Labels</p>
                <div className="filter-pills">
                  {["All", ...spotLabels].map((label) => (
                    <button
                      key={label}
                      className={spotFilter === label ? "active" : ""}
                      type="button"
                      onClick={() => setSpotFilter(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="clear-filter-button"
                type="button"
                onClick={() => {
                  setSpotNameQuery("");
                  setSpotLocationQuery("");
                  setSpotFilter("All");
                }}
                disabled={!spotFilterCount}
              >
                Clear filters
              </button>
            </section>
          )}
          {spotFormOpen && (
            <form
              className="profile-form spot-form"
              onSubmit={submitStudySpot}
            >
              <div className="spot-form-heading">
                <div>
                  <p className="eyebrow">New study spot</p>
                  <h2>Suggest a place.</h2>
                </div>
                <p>Submissions are visible to signed-in Waseda members.</p>
              </div>
              <div className="form-row equal">
                <label>
                  Spot name
                  <input
                    required
                    maxLength={120}
                    value={spotForm.name}
                    onChange={(event) =>
                      setSpotForm({ ...spotForm, name: event.target.value })
                    }
                    placeholder="Central Library"
                  />
                </label>
                <label>
                  Location
                  <input
                    required
                    maxLength={180}
                    value={spotForm.location}
                    onChange={(event) =>
                      setSpotForm({
                        ...spotForm,
                        location: event.target.value,
                      })
                    }
                    placeholder="Building 18, 2nd floor"
                  />
                </label>
              </div>
              <label>
                Description
                <textarea
                  required
                  maxLength={1200}
                  rows={3}
                  value={spotForm.description}
                  onChange={(event) =>
                    setSpotForm({
                      ...spotForm,
                      description: event.target.value,
                    })
                  }
                  placeholder="What makes this a useful place to study?"
                />
              </label>
              <label>
                Labels
                <input
                  maxLength={240}
                  value={spotForm.labels}
                  onChange={(event) =>
                    setSpotForm({ ...spotForm, labels: event.target.value })
                  }
                  placeholder="Quiet, Outlets, Group-friendly"
                />
                <small>Separate labels with commas.</small>
              </label>
              <button className="button primary" type="submit">
                Submit spot
              </button>
            </form>
          )}
          {filteredSpots.length ? (
            <div className="private-grid spots">
              {filteredSpots.map((spot) => (
                <article className="private-card spot" key={spot.id}>
                  <div className="spot-card-image">
                    <Image
                      src="/study-spots.jpg"
                      alt={`Study spot preview for ${spot.name}`}
                      width={1471}
                      height={828}
                    />
                  </div>
                  <p className="location-label">{spot.location}</p>
                  <h2>{spot.name}</h2>
                  <p className="card-description">{spot.description}</p>
                  <div className="spot-card-footer">
                    <div className="tag-row">
                      {spot.labels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                    <button
                      className={`upvote-button ${
                        upvotedSpots[getSpotKey(spot)] ? "upvoted" : ""
                      }`}
                      type="button"
                      onClick={() => upvoteSpot(spot)}
                      disabled={Boolean(upvotedSpots[getSpotKey(spot)])}
                      aria-label={`Upvote ${spot.name}`}
                      aria-pressed={Boolean(upvotedSpots[getSpotKey(spot)])}
                    >
                      <span aria-hidden="true">↑</span>
                      {getDemoUpvoteCount(spot) +
                        (upvotedSpots[getSpotKey(spot)] ? 1 : 0)}
                    </button>
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

      {contactModal && (
        <div
          className="modal-backdrop"
          onClick={() => setContactModal(null)}
          role="presentation"
        >
          <section
            className="contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setContactModal(null)}
              aria-label="Close contact details"
            >
              ×
            </button>
            <p className="eyebrow">Study buddy contact</p>
            <h2 id="contact-modal-title">Contact {contactModal.name}</h2>
            {contactModal.instagram ? (
              <div className="contact-detail">
                <span>Instagram</span>
                <strong>{contactModal.instagram}</strong>
              </div>
            ) : (
              <p className="contact-unavailable">
                This student has not shared contact details.
              </p>
            )}
            <button
              className="button primary modal-action"
              type="button"
              onClick={() => setContactModal(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}

      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </main>
  );
}
