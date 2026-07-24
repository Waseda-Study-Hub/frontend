"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, Clock, Link2, Send, UserRoundCheck, X } from "lucide-react";
import { ProtectedPage } from "@/components/layout/protected-page";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import type { ContactMethod, StudyRequestSummary } from "@/types/api";

type Box = "incoming" | "sent" | "connected";

const tabs: Array<{ id: Box; label: string; icon: typeof Clock }> = [
  { id: "incoming", label: "Incoming", icon: Clock },
  { id: "sent", label: "Sent", icon: Send },
  { id: "connected", label: "Connected", icon: UserRoundCheck },
];
const contactOptions: Array<[ContactMethod, string]> = [
  ["waseda_email", "Waseda email"],
  ["instagram", "Instagram"],
  ["discord", "Discord"],
  ["line", "LINE"],
];

export default function RequestsPage() {
  const { user, token } = useAuth();
  const client = useQueryClient();
  const [box, setBox] = useState<Box>("incoming");
  const [revealId, setRevealId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptMethods, setAcceptMethods] = useState<ContactMethod[]>([
    "waseda_email",
  ]);
  const profile = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: Boolean(user?.emailVerified),
    queryFn: async ({ signal }) => api.profile((await token())!, signal),
  });
  const availableMethods = contactOptions
    .filter(([method]) => Boolean(profile.data?.contacts[method]))
    .map(([method]) => method);
  const requests = useInfiniteQuery({
    queryKey: ["requests", user?.uid, box],
    enabled: Boolean(user?.emailVerified),
    initialPageParam: "",
    queryFn: async ({ pageParam, signal }) =>
      api.requests(box, (await token())!, pageParam || undefined, signal),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const requestItems = requests.data?.pages.flatMap((page) => page.items) ?? [];
  const contact = useQuery({
    queryKey: ["connection", user?.uid, revealId],
    enabled: Boolean(revealId && user?.emailVerified),
    queryFn: async ({ signal }) =>
      api.connection(revealId!, (await token())!, signal),
  });

  const transition = useMutation({
    mutationFn: async ({
      request,
      action,
      contactMethods,
    }: {
      request: StudyRequestSummary;
      action: "accept" | "decline" | "cancel";
      contactMethods?: ContactMethod[];
    }) =>
      api.transitionRequest(
        request.id,
        action,
        (await token())!,
        action === "accept" ? contactMethods : undefined,
      ),
    onSuccess: () => {
      setAcceptingId(null);
      client.invalidateQueries({ queryKey: ["requests", user?.uid] });
      client.invalidateQueries({ queryKey: ["buddies", user?.uid] });
    },
  });

  const act = (
    request: StudyRequestSummary,
    action: "accept" | "decline" | "cancel",
    contactMethods?: ContactMethod[],
  ) => {
    if (
      action !== "accept" &&
      !window.confirm(
        action === "cancel"
          ? "Cancel this study request?"
          : "Decline this study request?",
      )
    )
      return;
    transition.mutate({ request, action, contactMethods });
  };

  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Privacy-first connections</span>
          <h1>Study requests</h1>
          <p>
            Contact information is returned only for accepted connections and
            only for methods selected by each student.
          </p>
        </div>
      </div>

      <div className="request-tabs" role="tablist" aria-label="Request lists">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={box === id}
            aria-controls="request-list"
            onClick={() => {
              setBox(id);
              setRevealId(null);
            }}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <section id="request-list" role="tabpanel" className="request-list">
        {requests.isLoading ? (
          <div className="card skeleton-block" aria-label="Loading requests" />
        ) : requests.isError ? (
          <div className="card error-panel" role="alert">
            <h2>Requests are unavailable</h2>
            <p>{requests.error.message}</p>
            <button className="secondary" onClick={() => requests.refetch()}>
              Try again
            </button>
          </div>
        ) : requestItems.length ? (
          <>
            {requestItems.map((request) => {
              const other =
                request.sender.uid === user?.uid
                  ? request.recipient
                  : request.sender;
              return (
                <article className="card request-card" key={request.id}>
                  <div className="request-person">
                    <span className="avatar" aria-hidden="true">
                      {other.nickname.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h2>{other.nickname}</h2>
                      <p className="muted">
                        {other.school_id} · Year {other.year}
                      </p>
                    </div>
                    <span className={`status-badge ${request.status}`}>
                      {request.status}
                    </span>
                  </div>
                  {request.topic && (
                    <p className="request-topic">
                      <strong>Topic:</strong> {request.topic}
                    </p>
                  )}
                  <p className="request-message">{request.message}</p>
                  <p className="timestamp">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(request.created_at))}
                  </p>
                  {box === "incoming" && request.status === "pending" && (
                    <>
                      {acceptingId === request.id && (
                        <fieldset className="accept-sharing">
                          <legend className="label">
                            Share after acceptance
                          </legend>
                          <p className="muted">
                            Only methods selected here can be returned to this
                            connection.
                          </p>
                          <div className="contact-grid">
                            {contactOptions.map(([id, label]) => (
                              <label className="contact-choice" key={id}>
                                <input
                                  type="checkbox"
                                  disabled={!availableMethods.includes(id)}
                                  checked={acceptMethods.includes(id)}
                                  onChange={() =>
                                    setAcceptMethods((values) =>
                                      values.includes(id)
                                        ? values.filter((value) => value !== id)
                                        : [...values, id],
                                    )
                                  }
                                />
                                {label}
                                {!availableMethods.includes(id) && (
                                  <small>Not set in profile</small>
                                )}
                              </label>
                            ))}
                          </div>
                          {!availableMethods.length && !profile.isLoading && (
                            <p className="field-error">
                              Add a contact method to your{" "}
                              <Link href="/profile">profile</Link> before
                              accepting.
                            </p>
                          )}
                        </fieldset>
                      )}
                      <div className="request-actions">
                        <button
                          className="button"
                          disabled={
                            transition.isPending ||
                            (acceptingId === request.id &&
                              (profile.isLoading ||
                                profile.isError ||
                                !acceptMethods.length))
                          }
                          onClick={() => {
                            if (acceptingId !== request.id) {
                              setAcceptingId(request.id);
                              setAcceptMethods(
                                availableMethods.includes("waseda_email")
                                  ? ["waseda_email"]
                                  : availableMethods.slice(0, 1),
                              );
                            } else if (acceptMethods.length) {
                              act(request, "accept", acceptMethods);
                            }
                          }}
                        >
                          <Check aria-hidden="true" />{" "}
                          {acceptingId === request.id
                            ? "Confirm acceptance"
                            : "Accept"}
                        </button>
                        <button
                          className="secondary danger-action"
                          disabled={transition.isPending}
                          onClick={() => act(request, "decline")}
                        >
                          <X aria-hidden="true" /> Decline
                        </button>
                      </div>
                    </>
                  )}
                  {box === "sent" && request.status === "pending" && (
                    <button
                      className="secondary danger-action"
                      disabled={transition.isPending}
                      onClick={() => act(request, "cancel")}
                    >
                      Cancel request
                    </button>
                  )}
                  {box === "connected" && request.status === "accepted" && (
                    <div>
                      <button
                        className="secondary"
                        onClick={() =>
                          setRevealId(
                            revealId === request.id ? null : request.id,
                          )
                        }
                      >
                        <Link2 aria-hidden="true" />
                        {revealId === request.id
                          ? "Hide contact details"
                          : "View shared contact details"}
                      </button>
                      {revealId === request.id && (
                        <div className="connection-panel">
                          {contact.isLoading ? (
                            <p>Loading authorized contacts…</p>
                          ) : contact.isError ? (
                            <p className="field-error">
                              {contact.error.message}
                            </p>
                          ) : contact.data?.contacts.length ? (
                            <dl>
                              {contact.data.contacts.map((item) => (
                                <div key={`${item.owner_uid}-${item.method}`}>
                                  <dt>
                                    {item.owner_nickname} ·{" "}
                                    {item.method.replace("_", " ")}
                                  </dt>
                                  <dd>{item.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p>No contact methods were shared.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            {requests.hasNextPage && (
              <div className="load-more">
                <button
                  className="secondary"
                  disabled={requests.isFetchingNextPage}
                  onClick={() => requests.fetchNextPage()}
                >
                  {requests.isFetchingNextPage
                    ? "Loading…"
                    : "Load more requests"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state card">
            <UserRoundCheck aria-hidden="true" />
            <h2>
              {box === "incoming"
                ? "No incoming requests"
                : box === "sent"
                  ? "No sent requests"
                  : "No accepted connections yet"}
            </h2>
            <p>
              {box === "connected"
                ? "Accepted study buddies and authorized contact details will appear here."
                : "You’re all caught up."}
            </p>
          </div>
        )}
      </section>
      {transition.error && (
        <p className="toast-error" role="alert">
          {transition.error.message}
        </p>
      )}
    </ProtectedPage>
  );
}
