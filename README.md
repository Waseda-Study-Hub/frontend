# Waseda Study Hub

Production frontend for an independent student project that helps Waseda students find course-aligned study partners and practical campus study spaces.

## Architecture

- Next.js App Router, React, strict TypeScript, and responsive custom CSS
- Firebase Web SDK for client authentication
- TanStack Query for cancellable server-state requests and cache clearing
- FastAPI as the only application-data boundary; the browser never accesses Firestore

The original slide deck remains at `Group 5_ Waseda Study Hub.pdf`. The prototype on `gptReference` was inspected as a read-only reference and was not merged.

## Local development

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` to the FastAPI origin (normally `http://localhost:8000`). Configure the public Firebase web values in `.env.local`; these identify the public Firebase app and are not Firebase Admin credentials.

The backend is a separate repository:

```bash
git clone https://github.com/Waseda-Study-Hub/backend.git
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend-only `serviceAccountKey.json` must never be copied here or exposed through `NEXT_PUBLIC_*`.

## Production behavior

There is no implicit demo-data fallback. If the API is unavailable or misconfigured, the UI reports the failure. No mock mode is shipped. Authentication requires public Firebase variables and an allowed domain from `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`.

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Read [the backend contract](docs/backend-contract.md) and [the backend gap specification](docs/backend-gap-spec.md) before deployment. The current backend is not production-safe because it does not verify Firebase tokens or authorize user-scoped data.
