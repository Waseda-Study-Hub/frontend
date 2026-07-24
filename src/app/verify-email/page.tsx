"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const auth = useAuth();
  const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState<"check" | "resend" | "signout" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth.loading && !auth.configured) router.replace("/sign-in");
    else if (!auth.loading && !auth.user) router.replace("/sign-in");
    else if (auth.user?.emailVerified) router.replace("/dashboard");
  }, [auth.configured, auth.loading, auth.user, router]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function check() {
    setBusy("check");
    setMessage("");
    try {
      const verified = await auth.refreshVerification();
      if (verified) router.replace("/dashboard");
      else setMessage("Your email is not verified yet. Check your inbox.");
    } catch {
      setMessage("We could not refresh your account. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    setBusy("resend");
    setMessage("");
    try {
      await auth.resendVerification();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("Verification email sent.");
    } catch {
      setMessage("We could not resend the email. Please try again later.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="center-page">
      <section className="card verify-card stack">
        <div className="status-icon" aria-hidden="true">
          <MailCheck />
        </div>
        <div>
          <span className="eyebrow">One last step</span>
          <h1>Verify your Waseda email</h1>
          <p className="muted">
            We sent a verification link to{" "}
            <strong>{auth.user?.email ?? "your email address"}</strong>. Open
            it, then return here to continue.
          </p>
        </div>
        {message && <p role="status">{message}</p>}
        <button className="button" disabled={Boolean(busy)} onClick={check}>
          <RefreshCw aria-hidden="true" />
          {busy === "check" ? "Checking…" : "I’ve verified — check again"}
        </button>
        <button
          className="secondary"
          disabled={Boolean(busy) || cooldown > 0}
          onClick={resend}
        >
          {busy === "resend"
            ? "Sending…"
            : cooldown
              ? `Resend available in ${cooldown}s`
              : "Resend verification email"}
        </button>
        <button
          className="text-button"
          disabled={Boolean(busy)}
          onClick={async () => {
            setBusy("signout");
            await auth.signOut();
            router.replace("/sign-in");
          }}
        >
          Use a different account
        </button>
        <small className="muted">
          Independent student project · Access is checked again by the API.
        </small>
      </section>
    </main>
  );
}
