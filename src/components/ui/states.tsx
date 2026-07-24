export function LoadingCards() {
  return (
    <div className="grid" aria-label="Loading">
      <div className="card">Loading…</div>
      <div className="card">Loading…</div>
      <div className="card">Loading…</div>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="card" role="alert">
      <h2>We couldn’t load this</h2>
      <p className="error">{message}</p>
      {retry && (
        <button className="secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
