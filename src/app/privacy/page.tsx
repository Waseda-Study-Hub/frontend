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
          sends a short-lived Firebase ID token to the API. The secure backend
          verifies the token, email-verification claim, and exact permitted
          Waseda domain before serving student data.
        </p>
        <p>
          Directory responses contain public academic fields only. Contact
          values are returned only to participants in an accepted request and
          only for methods explicitly selected for that connection.
        </p>
        <p>
          Private and pending study-spot contributions are never returned by the
          public directory. Authentication and visibility are enforced by the
          API, not by hiding browser controls.
        </p>
      </article>
    </main>
  );
}
