import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";

export type PublicRuntimeConfig = {
  apiBaseUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
  };
};

let runtimeConfigPromise: Promise<PublicRuntimeConfig> | null = null;
let firebaseClientPromise: Promise<ReturnType<
  typeof createFirebaseClient
> | null> | null = null;

export function getPublicRuntimeConfig() {
  runtimeConfigPromise ??= fetch("/api/config").then(async (response) => {
    if (!response.ok) throw new Error("Could not load sign-in configuration.");
    return response.json() as Promise<PublicRuntimeConfig>;
  });
  return runtimeConfigPromise;
}

function createFirebaseClient(config: PublicRuntimeConfig["firebase"]) {
  const app = getApps().length ? getApp() : initializeApp(config);
  return {
    auth: getAuth(app),
    provider: new GoogleAuthProvider(),
    onAuthStateChanged,
    signInWithPopup,
    signOut,
  };
}

export async function getFirebaseClient() {
  if (typeof window === "undefined") return null;
  firebaseClientPromise ??= getPublicRuntimeConfig().then((config) => {
    if (!Object.values(config.firebase).every(Boolean)) return null;
    return createFirebaseClient(config.firebase);
  });
  return firebaseClientPromise;
}
