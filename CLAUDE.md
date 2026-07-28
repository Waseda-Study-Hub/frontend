# CLAUDE.md — Waseda Study Hub Frontend

This file gives Claude Code context on this repo. Read it before making changes.

## What this is
Next.js/TypeScript frontend for Waseda Study Hub. Backend is a **separate repo**
(FastAPI/Python) — this app calls it over REST for most things. Auth goes
directly to Firebase, and real-time messaging goes directly to Firestore (see
"The messaging exception" below) — those two are deliberate exceptions to the
"always go through the backend" rule. Built by a 5-person student team for
GDGoC Waseda x IPUT Innovation Showcase 2026, deployed on Vercel.

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (via `@tailwindcss/postcss` — no separate config file, uses
  the CSS-first Tailwind v4 approach)
- Firebase (client SDK): Google sign-in, and direct Firestore access scoped to
  the real-time messaging feature only (see below)
- Deployed on Vercel

## Architecture
```
app/
  layout.tsx           → root layout
  page.tsx             → main app flow (single-page: auth → profile → buddies/spots)
  api/
    config/route.ts    → serves Firebase config + API_BASE_URL from env vars
                          at RUNTIME (not build time) — this is how the same
                          build works in dev and prod with different backends
  lib/
    firebase.ts          → Firebase client SDK init
    waseda-auth.ts        → isAllowedWasedaEmail() — domain allowlist check,
                            10 official @*.waseda.jp domains (see below)
    chat.ts               → direct Firestore reads/writes for messaging
                            (conversations/messages collections) — the one
                            deliberate exception to "never touch Firestore
                            directly," secured by firestore.rules in this repo
    reports.ts, study-spot-comments.ts → similar direct-Firestore helpers for
                            reporting and spot comments
  components/
    chat-panel.tsx, report-modal.tsx, study-spot-comments-modal.tsx
firestore.rules          → security rules for the direct-Firestore features above
firestore.indexes.json, firebase.json, .firebaserc → Firebase project config
public/
  study-buddies.jpg, study-spots.jpg, og.png, favicon.png → the only images
  actually referenced in code; don't re-add create-next-app's default
  file.svg/globe.svg/window.svg/favicon.svg placeholders, they were unused cruft
```

## The messaging exception — read this before assuming a Firestore rule
The backend repo's CLAUDE.md says the frontend never reads/writes Firestore
directly. That's true for profiles, buddies, and study spots, but **not** for
messaging, reports, or study-spot comments — `lib/chat.ts`, `lib/reports.ts`,
and `lib/study-spot-comments.ts` all use the Firestore client SDK directly with
real-time listeners (`onSnapshot`), secured by `firestore.rules` in this repo.
This is intentional (real-time delivery is much simpler this way than polling
a REST API) — don't "fix" it by routing these through the backend without
discussing with the team, and don't use it as precedent for putting *other*
new features on direct Firestore access.

## The auth flow — understand this before touching it
1. User clicks Sign In → Firebase `signInWithPopup` (Google provider)
2. On return, we get the user's email from the Firebase Auth result
3. `isAllowedWasedaEmail(email)` in `lib/waseda-auth.ts` checks the domain against
   a hardcoded `Set` of the 10 official Waseda mail domains (waseda.jp, akane,
   asagi, fuji, moegi, ruri, suou, toki, aoni, kurenai — all `.waseda.jp`)
4. Fails the check → sign out immediately, show rejection message
5. Passes → Firebase UID becomes the identity used for ALL backend calls, with
   the Firebase ID token sent as `Authorization: Bearer <token>` on every
   request (see `authorizedFetch` / `loadPrivateData` in `page.tsx`)

The backend now verifies this token server-side (`verify_token`/`verify_uid_match`
in the backend's `app/auth/firebase.py`) and checks the decoded uid against any
`{uid}` path param — this used to be a client-only UX gate but is now a real
trust boundary as of this session. Still don't weaken the client-side check;
it's the first line of defense and avoids a round-trip for obviously-wrong emails.

## The `/api/config` pattern — don't break this
The frontend never hardcodes Firebase keys or the backend URL. Instead:
- `app/api/config/route.ts` is a Next.js route that reads env vars
  (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
  `FIREBASE_APP_ID`, `FIRESTORE_DATABASE_ID`, `API_BASE_URL`) and returns them
  as JSON
- The client fetches this on load, then initializes Firebase and knows where
  the backend lives
- This is WHY the same code works locally (API_BASE_URL=http://127.0.0.1:8000)
  and in prod (API_BASE_URL=https://backend-t7zh.onrender.com) — only the env
  vars change, never the code. Preserve this pattern for any new config values.
- **`.env.local` changes require restarting `next dev`** — Next.js reads env
  files at server boot, not per-request, so flipping `API_BASE_URL` between
  local and deployed backends needs a dev-server restart to take effect.

## Conventions — follow these exactly
- New env vars go in `.env.example` (with real, non-secret placeholder values —
  Firebase client config isn't secret by design, so unlike a typical backend
  `.env.example` these can stay filled in) AND get read through `/api/config`,
  never accessed directly via `process.env` in client components unless they're
  meant to be build-time/public.
- Backend calls follow the pattern: `fetch(\`${apiBaseUrl}/resource/${id}\`)` —
  `apiBaseUrl` comes from the config fetch, never hardcoded.
- A `404` from `GET /users/{uid}` is not an error state — it means "new user,
  show the profile creation form." Don't add generic error handling that
  swallows this distinction.
- Tailwind v4 conventions apply — utility classes only, no `tailwind.config.js`
  theme extensions unless the project already has one; check `postcss.config.mjs`
  and `globals.css` for existing design tokens before inventing new ones.
- Keep the single-page flow (auth → profile → buddies/spots) unless a feature
  genuinely needs new routes — this app is intentionally simple.
- Watch for duplicate CSS class definitions in `globals.css` — a duplicate
  `.match-reason` rule previously overrode the real one silently; if a class's
  visible style doesn't match what you just wrote, grep for a second definition
  before assuming a browser-cache issue.

## Known gaps / things NOT to assume are done
- Buddy/spot lists are fetched once per load, not subscribed to — no live
  updates if another user changes data mid-session (messaging is the one
  exception, via the direct-Firestore listeners described above).
- Messaging is not gated behind an accepted study request — any signed-in user
  can message any buddy today, even though contact info (Instagram) now
  correctly requires an accepted request first.
- No loading/error states are guaranteed consistent across components — check
  before assuming a pattern exists.

## Feature roadmap (coordinate with backend CLAUDE.md — same priority order)
1. ~~UI for "request to study"~~ **Done**: buddy cards show Request to study →
   Request sent → Accept/Decline → Contact (Instagram reveals only once
   accepted). State comes from `GET /requests/{uid}` (`incoming`/`outgoing`)
   loaded alongside buddies/spots in `loadPrivateData`.
2. Real-time messaging UI — already exists (see "The messaging exception"),
   not gated behind study requests yet (see Known gaps).
3. ~~Surface `availability_slots` overlap in the buddy card UI~~ **Done**:
   rendered as a tag row on each buddy card; backend folds it into
   `match_reason` too ("Overlapping availability").
4. Study-spot busyness indicator UI

## Local dev
```bash
nvm use 22          # package.json pins node 22.x
cp .env.example .env.local
# API_BASE_URL=http://127.0.0.1:8000 to hit a local backend, or the deployed
# Render URL already in .env.example to hit production — restart `npm run dev`
# after changing this
npm install
npm run dev          # http://localhost:3000
```

## Non-negotiables
- Never hardcode Firebase keys or API URLs in components — always through
  `/api/config`.
- Don't add direct Firestore reads/writes for NEW features without discussing
  it first — the existing ones (messaging, reports, spot comments) are a
  deliberate, security-rule-backed exception, not a green light to expand the
  pattern casually.
- Don't remove or weaken `isAllowedWasedaEmail()` — it's the product's UX trust
  boundary, and the backend now backs it up with real token verification.
- Before adding a UI library, check what's already a dependency in `package.json`
  — keep the dependency footprint small; this is a lean student project, not
  an enterprise app.
