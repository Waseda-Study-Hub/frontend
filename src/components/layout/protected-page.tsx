"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { AppShell } from "./app-shell";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && configured && !user) router.replace("/sign-in");
  }, [configured, loading, router, user]);
  if (loading)
    return (
      <main className="shell">
        <p>Restoring your session…</p>
      </main>
    );
  if (configured && !user)
    return (
      <main className="shell">
        <p>Redirecting to sign in…</p>
      </main>
    );
  return <AppShell>{children}</AppShell>;
}
