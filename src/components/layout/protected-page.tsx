"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { AppShell } from "./app-shell";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading || !configured) return;
    if (!user) router.replace("/sign-in");
    else if (!user.emailVerified) router.replace("/verify-email");
  }, [configured, loading, router, user]);
  if (loading)
    return (
      <main className="shell">
        <p>Restoring your session…</p>
      </main>
    );
  if (!configured)
    return (
      <main className="config-error" role="alert">
        <div className="card stack">
          <span className="eyebrow">Configuration required</span>
          <h1>Authentication is unavailable</h1>
          <p>
            This environment cannot safely open student data because Firebase
            Authentication is not configured.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="muted">
              Add the public Firebase web values from <code>.env.example</code>,
              then restart the development server.
            </p>
          )}
        </div>
      </main>
    );
  if (!user || !user.emailVerified)
    return (
      <main className="shell">
        <p>Checking verified student access…</p>
      </main>
    );
  return <AppShell>{children}</AppShell>;
}
