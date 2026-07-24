import Link from "next/link";
export default function NotFound() {
  return (
    <main className="shell">
      <span className="eyebrow">404</span>
      <h1>That page isn’t here.</h1>
      <p className="muted">Return to your study home and try another path.</p>
      <Link className="button" href="/dashboard">
        Go to dashboard
      </Link>
    </main>
  );
}
