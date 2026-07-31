# Waseda Study Hub Frontend

Next.js and TypeScript frontend for finding Waseda study buddies and study
spots. Public pages do not expose real member or location records. Private
features require a verified Waseda Google account.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Logged-in features

- Create and update a study-buddy profile.
- Optionally share an Instagram handle with study-buddy matches.
- View recommendations based on major and course overlap.
- Describe an ideal study buddy in natural language with AI Study Match.
- Send and receive private real-time messages.
- Archive, block, unblock, and report conversations.
- Browse and filter study spots.
- Comment on and report individual study spots.
- Submit new study spots.

## Commands

- `npm run dev` — run the local development server
- `npm run build` — create a production build
- `npm run lint` — check the source
- `npm run test:ai` — run deterministic AI-ranking regression tests
- `npm test` — run lint and the production build

## AI Study Match setup

AI Study Match uses a server-side Gemini request. Add a fresh key to
`.env.local` for local development and to Vercel for deployments:

```text
GEMINI_API_KEY=<secret key>
GEMINI_MODEL=gemini-3.6-flash
```

