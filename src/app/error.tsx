"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="shell">
      <span className="eyebrow">Something went wrong</span>
      <h1>We couldn’t show this page.</h1>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
