"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  reload,
  type User,
} from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, firebaseConfigured } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string): Promise<User>;
  resetPassword(email: string): Promise<void>;
  resendVerification(): Promise<void>;
  refreshVerification(): Promise<boolean>;
  signOut(): Promise<void>;
  token(): Promise<string | undefined>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: firebaseConfigured,
      async signIn(email, password) {
        if (!auth) throw new Error("Firebase is not configured.");
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
      },
      async signUp(email, password) {
        if (!auth) throw new Error("Firebase is not configured.");
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await sendEmailVerification(result.user);
        return result.user;
      },
      async resetPassword(email) {
        if (!auth) throw new Error("Firebase is not configured.");
        await sendPasswordResetEmail(auth, email);
      },
      async resendVerification() {
        if (!user) throw new Error("Sign in first.");
        await sendEmailVerification(user);
      },
      async refreshVerification() {
        if (!user) return false;
        await reload(user);
        const refreshedUser = auth?.currentUser ?? user;
        if (refreshedUser.emailVerified) {
          // The backend checks the email_verified token claim, not only the
          // mutable Firebase User object. Force a fresh ID token after reload.
          await refreshedUser.getIdToken(true);
        }
        setUser(refreshedUser);
        return refreshedUser.emailVerified;
      },
      async signOut() {
        queryClient.clear();
        if (auth) await firebaseSignOut(auth);
      },
      async token() {
        return user?.getIdToken();
      },
    }),
    [queryClient, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
