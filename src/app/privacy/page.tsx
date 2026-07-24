import Link from "next/link";
export default function Privacy() {
  return (
    <main className="shell">
      <div className="page-head">
        <div>
          <span className="eyebrow">Project information</span>
          <h1>Privacy and trust</h1>
        </div>
        <Link href="/sign-in" className="secondary">
          Back
        </Link>
      </div>
      <article className="card stack">
        <p>
          Waseda Study Hub is an independent student project, not an official
          Waseda University service.
        </p>
        <p>
          Firebase Authentication handles account credentials. The frontend
          sends a Firebase ID token to the API when available, but the current
          backend does not yet verify it; production deployment must wait until
          the backend gap is closed.
        </p>
        <p>
          Directory views intentionally omit contact fields. Contact sharing
          remains unavailable until acceptance authorization is enforced by the
          API.
        </p>
      </article>
    </main>
  );
}
