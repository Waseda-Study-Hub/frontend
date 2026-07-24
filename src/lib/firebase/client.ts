import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseConfigLooksValid = Boolean(
  config.apiKey?.startsWith("AIza") &&
  config.authDomain?.includes(".") &&
  config.projectId &&
  /^[a-z0-9-]+$/.test(config.projectId) &&
  config.appId?.includes(":"),
);

let configuredAuth: ReturnType<typeof getAuth> | null = null;
if (firebaseConfigLooksValid) {
  try {
    configuredAuth = getAuth(getApps()[0] ?? initializeApp(config));
  } catch {
    configuredAuth = null;
  }
}

export const firebaseConfigured = Boolean(configuredAuth);
export const auth = configuredAuth;
