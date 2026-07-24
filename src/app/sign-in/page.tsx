"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/features/auth/auth-provider";
import { isAllowedEmail, mapAuthError } from "@/features/auth/validation";

export default function SignInPage() {
  const auth = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!isAllowedEmail(email))
      return setMessage("Use an allowed Waseda student email domain.");
    setBusy(true);
    try {
      if (mode === "reset") {
        await auth.resetPassword(email);
        setMessage("Password reset email sent. Check your inbox.");
      } else if (mode === "signup") {
        await auth.signUp(email, password);
        setMessage("Account created. Verify your email before continuing.");
      } else {
        await auth.signIn(email, password);
        router.replace("/dashboard");
      }
    } catch (error) {
      setMessage(
        error instanceof FirebaseError
          ? mapAuthError(error.code)
          : error instanceof Error
            ? error.message
            : "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="brand">
          <span className="brandmark" />
          Waseda Study Hub
        </div>
        <div>
          <span className="eyebrow">A quieter way to connect</span>
          <h1>Study smarter, together.</h1>
          <p>
            Find course-aligned peers and practical campus spaces without
            turning study into a social feed.
          </p>
        </div>
        <small>
          Independent student project · Not an official Waseda University
          service
        </small>
      </section>
      <section className="auth-panel">
        <div className="auth-card stack">
          <div>
            <span className="eyebrow">Student access</span>
            <h2>
              {mode === "signup"
                ? "Create your account"
                : mode === "reset"
                  ? "Reset your password"
                  : "Welcome back"}
            </h2>
            <p className="muted">
              {mode === "signup"
                ? "Use your Waseda student email."
                : "Secure authentication is provided by Firebase."}
            </p>
          </div>
          {!auth.configured && (
            <div className="notice" role="status">
              Authentication is not configured in this environment. Add the
              public Firebase variables from <code>.env.example</code>.
            </div>
          )}
          <form className="stack" onSubmit={submit}>
            <label className="field">
              Waseda student email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            {mode !== "reset" && (
              <label className="field">
                Password
                <div className="course-row">
                  <input
                    type={show ? "text" : "password"}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShow(!show)}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            )}
            {message && (
              <p
                className={
                  message.includes("sent") || message.includes("created")
                    ? "success"
                    : "error"
                }
                role="status"
              >
                {message}
              </p>
            )}
            <button className="button" disabled={busy || !auth.configured}>
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset email"
                    : "Sign in"}
            </button>
          </form>
          <div className="auth-actions">
            <button
              className="text-button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup"
                ? "Already have an account?"
                : "Create account with Waseda email"}
            </button>
            {mode !== "reset" ? (
              <button className="text-button" onClick={() => setMode("reset")}>
                Forgot password?
              </button>
            ) : (
              <button className="text-button" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            )}
          </div>
          <small className="muted">
            Your password is handled by Firebase Authentication. This app never
            sends it to the Study Hub API.
          </small>
          <Link href="/privacy" className="text-button">
            Privacy and project information
          </Link>
        </div>
      </section>
    </main>
  );
}
