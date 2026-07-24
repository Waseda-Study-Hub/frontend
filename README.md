# Waseda Study Hub

Waseda Study Hub is an independent student project for finding
course-aligned study partners and practical campus study spaces. It is not an
official Waseda University service.

## Architecture

- Next.js App Router, React, strict TypeScript, and responsive CSS
- Firebase Web SDK for sign-in, account creation, email verification, and
  password reset
- TanStack Query for authenticated, cancellable server state
- React Hook Form and Zod for forms and runtime response validation
- FastAPI as the only application-data boundary; the browser never accesses
  Firestore

The project deck remains at `Group 5_ Waseda Study Hub.pdf`. The
`gptReference` branch was used only as a read-only visual reference and was not
merged.

## Coordinated backend requirement

The frontend contract is implemented by the separate
`Waseda-Study-Hub/backend` branch `feat/secure-study-hub-contract` in
[backend PR #3](https://github.com/Waseda-Study-Hub/backend/pull/3). Until that
pull request is merged, deploy the frontend only against that branch. The
backend must be deployed first.

The secure API verifies every Firebase bearer token, the
`email_verified` claim, and an exact configured email domain. It derives user
authority from the token UID, redacts buddy responses, authorizes contact
sharing after acceptance, and isolates private or unapproved study spots.

See [the endpoint matrix](docs/backend-contract.md) and
[the remaining rollout gaps](docs/backend-gap-spec.md).

## Frontend setup

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` to the FastAPI origin, normally
`http://localhost:8000`. Add the Firebase project’s public web configuration to
`.env.local`. These identifiers are designed to be public; Firebase Admin
credentials are not.

There is no production mock-data fallback. If Firebase or the API is missing,
protected pages fail closed and explain the configuration or network problem.
The Playwright suite uses test-only request interception that is never included
in runtime code.

## Backend setup

Python 3.11+ is required.

```bash
git clone https://github.com/Waseda-Study-Hub/backend.git
cd backend
git switch feat/secure-study-hub-contract
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
uvicorn main:app --reload
```

Use Application Default Credentials or a backend-only
`FIREBASE_CREDENTIALS_PATH`. Never copy a service-account JSON file into this
repository or expose it through a `NEXT_PUBLIC_*` variable. Keep the frontend
and backend allowed-domain lists aligned. Add every deployed frontend origin
to the backend’s exact `CORS_ORIGINS` allowlist.

## Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The browser suite covers protected routing, verified/unverified accounts,
profile onboarding, filters, request privacy, contribution authority,
responsive widths, and automated accessibility checks. Backend tests exercise
the same HTTP contract with Firebase and Firestore boundaries replaced through
dependency overrides.

No live Firebase/Firestore credentials are stored in this repository, so the
final cloud-backed smoke test must be performed in the authorized deployment
environment before release.
