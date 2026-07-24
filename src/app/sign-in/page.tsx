"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [fieldError, setFieldError] = useState<{
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (!auth.loading && auth.user) {
      router.replace(auth.user.emailVerified ? "/dashboard" : "/verify-email");
    }
  }, [auth.loading, auth.user, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setFieldError({});
    if (!isAllowedEmail(email)) {
      setFieldError({ email: "Use an allowed Waseda student email domain." });
      return;
    }
    if (mode !== "reset" && password.length < 8) {
      setFieldError({
        password: "Use at least 8 characters for your password.",
      });
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset") {
        await auth.resetPassword(email);
        setMessage("Password reset email sent. Check your inbox.");
      } else if (mode === "signup") {
        await auth.signUp(email, password);
        router.replace("/verify-email");
      } else {
        const signedInUser = await auth.signIn(email, password);
        router.replace(
          signedInUser.emailVerified ? "/dashboard" : "/verify-email",
        );
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
            <div className="notice" role="alert">
              Authentication is unavailable. This app fails closed until
              Firebase is configured.
              {process.env.NODE_ENV === "development" && (
                <>
                  {" "}
                  Add the public web variables from <code>.env.example</code>.
                </>
              )}
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
                aria-invalid={Boolean(fieldError.email)}
                aria-describedby={fieldError.email ? "email-error" : undefined}
                required
              />
              {fieldError.email && (
                <span className="field-error" id="email-error">
                  {fieldError.email}
                </span>
              )}
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
                    minLength={8}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(fieldError.password)}
                    aria-describedby={
                      fieldError.password ? "password-error" : undefined
                    }
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
                {fieldError.password && (
                  <span className="field-error" id="password-error">
                    {fieldError.password}
                  </span>
                )}
                {mode === "signup" && (
                  <small className="muted">Use 8 or more characters.</small>
                )}
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
            <button
              className="button"
              disabled={busy || auth.loading || !auth.configured}
            >
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
