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
- Send and receive private real-time messages.
- Browse and filter study spots.
- Submit new study spots to Firestore.

## Commands

- `npm run dev` — run the local development server
- `npm run build` — create a production build
- `npm run lint` — check the source
- `npm test` — run lint and the production build
