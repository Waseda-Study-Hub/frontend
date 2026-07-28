"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import Image from "next/image";
import {
  getFirebaseClient,
  getPublicRuntimeConfig,
} from "./lib/firebase";
import type { ReportTarget } from "./lib/reports";
import { isAllowedWasedaEmail } from "./lib/waseda-auth";
import ChatPanel, { type ChatTarget } from "./components/chat-panel";
import ReportModal from "./components/report-modal";
import StudySpotCommentsModal from "./components/study-spot-comments-modal";

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

type StudyRequest = {
  id: string;
  from_uid: string;
  to_uid: string;
  status: "pending" | "accepted" | "declined";
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
  const [view, setView] = useState<
    "buddies" | "spots" | "messages" | "profile"
  >("buddies");
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<StudyRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<StudyRequest[]>([]);
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
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const [commentSpot, setCommentSpot] = useState<StudySpot | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
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

    return spots
      .filter((spot) => {
        const matchesName =
          !nameTerm || spot.name.toLowerCase().includes(nameTerm);
        const matchesLocation =
          !locationTerm || spot.location.toLowerCase().includes(locationTerm);
        const matchesLabel =
          spotFilter === "All" ||
          spot.labels.some((label) => label.toLowerCase() === labelTerm);

        return matchesName && matchesLocation && matchesLabel;
      })
      .sort((a, b) => {
        const aVotes =
          getDemoUpvoteCount(a) + (upvotedSpots[getSpotKey(a)] ? 1 : 0);
        const bVotes =
          getDemoUpvoteCount(b) + (upvotedSpots[getSpotKey(b)] ? 1 : 0);
        return bVotes - aVotes || a.name.localeCompare(b.name);
      });
  }, [
    spots,
    spotFilter,
    spotLocationQuery,
    spotNameQuery,
    upvotedSpots,
  ]);

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

  function getRequestState(buddyUid: string) {
    const outgoing = outgoingRequests.find((r) => r.to_uid === buddyUid);
    const incoming = incomingRequests.find((r) => r.from_uid === buddyUid);

    if (outgoing?.status === "accepted" || incoming?.status === "accepted") {
      return { kind: "accepted" as const };
    }
    if (incoming?.status === "pending") {
      return { kind: "incoming" as const, request: incoming };
    }
    if (outgoing?.status === "pending") {
      return { kind: "outgoing" as const };
    }
    return { kind: "none" as const };
  }

  async function sendStudyRequest(buddy: Buddy) {
    try {
      const response = await authorizedFetch(`/requests/${buddy.uid}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Could not send the study request.");
      const request: StudyRequest = await response.json();
      setOutgoingRequests((current) => [
        ...current.filter((item) => item.id !== request.id),
        request,
      ]);
      showToast(`Study request sent to ${buddy.full_name}.`);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Could not send the study request.",
      );
    }
  }

  async function respondToRequest(
    request: StudyRequest,
    status: "accepted" | "declined",
  ) {
    try {
      const response = await authorizedFetch(`/requests/${request.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Could not update the study request.");
      const updated: StudyRequest = await response.json();
      setIncomingRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      showToast(
        status === "accepted"
          ? "Study request accepted."
          : "Study request declined.",
      );
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Could not update the study request.",
      );
    }
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
        setIncomingRequests([]);
        setOutgoingRequests([]);
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

      const [buddyResponse, spotResponse, requestsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/buddies/recommend/${activeUser.uid}`, { headers }),
        fetch(`${apiBaseUrl}/study-spots/`, { headers }),
        fetch(`${apiBaseUrl}/requests/${activeUser.uid}`, { headers }),
      ]);
      if (!buddyResponse.ok || !spotResponse.ok || !requestsResponse.ok) {
        throw new Error("Could not load the Study Hub.");
      }
      setBuddies(await buddyResponse.json());
      setSpots(await spotResponse.json());
      const requestsData = await requestsResponse.json();
      setIncomingRequests(requestsData.incoming ?? []);
      setOutgoingRequests(requestsData.outgoing ?? []);
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
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setChatTarget(null);
    setCommentSpot(null);
    setReportTarget(null);
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

        <section className="landing-steps" aria-label="How Waseda Study Hub works">
          <article>
            <span className="step-number">1</span>
            <h3>Sign in with your Waseda email</h3>
            <p>
              We check your Google sign-in against the official @*.waseda.jp
              domains, so every member is a verified Waseda student.
            </p>
          </article>
          <article>
            <span className="step-number">2</span>
            <h3>Build your profile</h3>
            <p>
              Add your major, current courses, and when you&apos;re free to
              study so we can find people who actually overlap with you.
            </p>
          </article>
          <article>
            <span className="step-number">3</span>
            <h3>Match, request, and connect</h3>
            <p>
              Send a study request to a match. Contact details only unlock
              once they accept, so nothing is shared automatically.
            </p>
          </article>
        </section>

        <section className="landing-about" aria-label="About Waseda Study Hub">
          <p className="eyebrow">Why we built this</p>
          <p>
            Finding a study partner at Waseda usually comes down to whoever
            happens to be in your seminar or your group chat. We wanted
            something better: a way to find people studying the same things
            as you, at the times you&apos;re actually free, without handing
            out your contact info to strangers first. Waseda Study Hub was
            built by a small team of students for the GDGoC Waseda x IPUT
            Innovation Showcase, and it&apos;s meant to feel like something a
            Waseda student would actually build for other Waseda students.
          </p>
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

        <section className="landing-features" aria-label="Features">
          <div className="landing-features-heading">
            <p className="eyebrow">Features</p>
            <h2>Everything you need to study with people, not alone.</h2>
          </div>
          <div className="landing-features-grid">
            <article className="feature-card">
              <h3>Waseda-verified access</h3>
              <p>
                Only official @*.waseda.jp accounts can sign in, so everyone
                you meet here is a real Waseda student.
              </p>
            </article>
            <article className="feature-card">
              <h3>Smart buddy matching</h3>
              <p>
                Every match shows why you&apos;re paired: same major,
                overlapping courses, or shared availability.
              </p>
            </article>
            <article className="feature-card">
              <h3>Privacy-first requests</h3>
              <p>
                Contact info like Instagram stays hidden until a study request
                is sent and accepted by both sides.
              </p>
            </article>
            <article className="feature-card">
              <h3>Real-time messaging</h3>
              <p>
                Chat with your study buddies the moment you&apos;re connected,
                with no page refresh needed.
              </p>
            </article>
            <article className="feature-card">
              <h3>Crowd-sourced study spots</h3>
              <p>
                Discover quiet corners and group-friendly rooms shared by
                other students around campus.
              </p>
            </article>
            <article className="feature-card">
              <h3>Community feedback</h3>
              <p>
                Upvote, comment, and report spots to keep the list accurate
                and useful for everyone.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-roadmap" aria-label="What's next">
          <div className="landing-features-heading">
            <p className="eyebrow">What&apos;s next</p>
            <h2>Still on our list.</h2>
            <p className="landing-roadmap-subhead">
              These aren&apos;t live yet. We&apos;re building them next.
            </p>
          </div>
          <div className="landing-features-grid">
            <article className="feature-card roadmap-card">
              <span className="roadmap-tag">Coming soon</span>
              <h3>AI study concierge</h3>
              <p>
                Ask a question like &quot;where&apos;s quiet right now near
                building 11?&quot; and get a straight answer instead of
                scrolling the whole spot list.
              </p>
            </article>
            <article className="feature-card roadmap-card">
              <span className="roadmap-tag">Coming soon</span>
              <h3>Live busyness at study spots</h3>
              <p>
                See how full a spot is before you walk over, based on
                check-ins from students already there.
              </p>
            </article>
            <article className="feature-card roadmap-card">
              <span className="roadmap-tag">Coming soon</span>
              <h3>Smarter matching on bios</h3>
              <p>
                Beyond major and courses, match on what you&apos;re actually
                studying for, not just keyword overlap.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-faq" aria-label="Frequently asked questions">
          <div className="landing-faq-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Good to know</h2>
          </div>
          <article className="faq-item">
            <h3>Who can join Waseda Study Hub?</h3>
            <p>
              Anyone with an official @*.waseda.jp email address. We check
              your sign-in domain before granting access.
            </p>
          </article>
          <article className="faq-item">
            <h3>Will my contact info be shared automatically?</h3>
            <p>
              No. Your Instagram tag only becomes visible to a buddy after you
              have both agreed to a study request.
            </p>
          </article>
          <article className="faq-item">
            <h3>Is Waseda Study Hub an official university service?</h3>
            <p>
              No, it&apos;s an independent project built by students for the
              GDGoC Waseda x IPUT Innovation Showcase, not run or endorsed by
              Waseda University.
            </p>
          </article>
          <article className="faq-item">
            <h3>Is my profile visible to non-Waseda users?</h3>
            <p>
              No. Everything behind sign-in, including profiles, study spots,
              and messages, stays private to verified Waseda members.
            </p>
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
          <button
            className={view === "messages" ? "active" : ""}
            onClick={() => {
              setChatTarget(null);
              setView("messages");
            }}
            disabled={profileMissing}
          >
            Messages
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
              : view === "messages"
                ? "Messages"
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
              {filteredBuddies.map((buddy) => {
                const requestState = getRequestState(buddy.uid);
                return (
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
                    {buddy.availability_slots.length > 0 && (
                      <div className="tag-row availability-row">
                        {buddy.availability_slots.map((slot) => (
                          <span key={slot}>{slot}</span>
                        ))}
                      </div>
                    )}
                    {buddy.bio && (
                      <p className="card-description">{buddy.bio}</p>
                    )}
                    <div className="buddy-card-actions">
                      <button
                        className="message-button"
                        type="button"
                        onClick={() => {
                          setChatTarget({
                            uid: buddy.uid,
                            name: buddy.full_name,
                          });
                          setView("messages");
                        }}
                      >
                        Message
                      </button>
                      {requestState.kind === "accepted" && (
                        <button
                          className="outline-button"
                          type="button"
                          onClick={() =>
                            setContactModal({
                              name: buddy.full_name,
                              instagram: buddy.instagram_tag ?? null,
                            })
                          }
                        >
                          Contact
                        </button>
                      )}
                      {requestState.kind === "incoming" && (
                        <>
                          <button
                            className="outline-button"
                            type="button"
                            onClick={() =>
                              respondToRequest(requestState.request, "accepted")
                            }
                          >
                            Accept
                          </button>
                          <button
                            className="outline-button"
                            type="button"
                            onClick={() =>
                              respondToRequest(requestState.request, "declined")
                            }
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {requestState.kind === "outgoing" && (
                        <button className="outline-button" type="button" disabled>
                          Request sent
                        </button>
                      )}
                      {requestState.kind === "none" && (
                        <button
                          className="outline-button"
                          type="button"
                          onClick={() => sendStudyRequest(buddy)}
                        >
                          Request to study
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-private">
              <h2>No matches yet.</h2>
              <p>Try another search or update your courses.</p>
            </div>
          )}
        </section>
      )}

      {!dataLoading && view === "messages" && !profileMissing && (
        <ChatPanel
          user={user}
          currentUserName={
            profile.fullName || user.displayName || user.email || "Waseda user"
          }
          target={chatTarget}
          onReport={setReportTarget}
        />
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
                    <div className="spot-card-actions">
                      <button
                        className="spot-comment-button"
                        type="button"
                        onClick={() => setCommentSpot(spot)}
                      >
                        Comments
                      </button>
                      <button
                        className="spot-report-button"
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            type: "study_spot",
                            id: spot.id,
                            label: spot.name,
                            reportedUserId: spot.added_by ?? "",
                          })
                        }
                      >
                        Report
                      </button>
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

      {commentSpot && (
        <StudySpotCommentsModal
          user={user}
          currentUserName={
            profile.fullName || user.displayName || user.email || "Waseda user"
          }
          spot={{
            id: commentSpot.id,
            name: commentSpot.name,
            addedBy: commentSpot.added_by ?? "",
          }}
          onClose={() => setCommentSpot(null)}
          onReport={setReportTarget}
        />
      )}

      {reportTarget && (
        <ReportModal
          user={user}
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onReported={() => {
            setReportTarget(null);
            showToast("Report submitted.");
          }}
        />
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
