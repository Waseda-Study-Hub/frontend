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

Open `http://localhost:3000`.

## Environment variables

```text
FIREBASE_API_KEY=AIzaSyCv_TZiTpmqWvCmdFauE9UH391qGwFVag8
FIREBASE_AUTH_DOMAIN=waseda-study-hub.firebaseapp.com
FIREBASE_PROJECT_ID=waseda-study-hub
FIREBASE_APP_ID=1:484191730969:web:1ab2505b2c743aec48d988
API_BASE_URL=https://backend-t7zh.onrender.com
```

These public values are already included as runtime defaults, so the current
project works without extra Vercel environment variables. You can add the
variables under **Project Settings → Environment Variables** later to override
the defaults without editing the source.

## Firebase Authentication

Enable the Google provider in Firebase Authentication and add every deployed
Vercel hostname to **Authentication → Settings → Authorized domains**.

The frontend signs in through the official Google popup and immediately signs
out accounts that do not use an approved Waseda domain.

The backend must also verify the Firebase ID token and Waseda email domain on
every private `/users`, `/buddies`, and `/study-spots` route. Hiding those
sections in the frontend is not a server-side security boundary.

## Commands

- `npm run dev` — run the local development server
- `npm run build` — create a production build
- `npm run lint` — check the source
- `npm test` — run lint and the production build
