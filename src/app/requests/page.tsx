import { ProtectedPage } from "@/components/layout/protected-page";
export default function RequestsPage() {
  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Privacy-first connections</span>
          <h1>Requests</h1>
          <p>
            Incoming, sent, and accepted requests will live here when the
            backend can persist and authorize them.
          </p>
        </div>
      </div>
      <div className="notice">
        <b>Unavailable safely.</b> The current backend has no request resources,
        status transitions, duplicate prevention, or server-side contact-sharing
        authorization. This interface does not fake success or reveal contacts.
      </div>
      <div className="grid" style={{ marginTop: "1rem" }}>
        {["Incoming", "Sent", "Connected"].map((x) => (
          <section className="card" key={x}>
            <h2>{x}</h2>
            <p className="muted">No supported records.</p>
          </section>
        ))}
      </div>
    </ProtectedPage>
  );
}
