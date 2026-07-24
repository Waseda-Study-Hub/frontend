import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="center-page">
      <section className="card verify-card stack">
        <div className="status-icon" aria-hidden="true">
          <ShieldX />
        </div>
        <span className="eyebrow">Access denied</span>
        <h1>This page isn’t available to your account</h1>
        <p className="muted">
          Sign in with a verified, permitted Waseda student email. If you
          believe this is a mistake, sign out and try the correct account.
        </p>
        <Link className="button" href="/sign-in">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
