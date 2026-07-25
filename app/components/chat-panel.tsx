"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  ensureConversation,
  otherParticipant,
  sendChatMessage,
  subscribeToConversations,
  subscribeToMessages,
  type ChatMessage,
  type ConversationSummary,
} from "../lib/chat";
import { getFirebaseClient } from "../lib/firebase";

export type ChatTarget = {
  uid: string;
  name: string;
};

type ChatPanelProps = {
  user: User;
  currentUserName: string;
  target: ChatTarget | null;
};

function formatMessageTime(value: Date | null) {
  if (!value) return "Sending…";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatConversationTime(value: Date | null) {
  if (!value) return "";
  const today = new Date();
  if (value.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(value);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(value);
}

export default function ChatPanel({
  user,
  currentUserName,
  target,
}: ChatPanelProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [activeName, setActiveName] = useState(target?.name ?? "");
  const [messageState, setMessageState] = useState<{
    conversationId: string | null;
    messages: ChatMessage[];
  }>({ conversationId: null, messages: [] });
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const client = await getFirebaseClient();
        if (!active) return;
        if (!client) throw new Error("Firebase chat is not configured.");

        unsubscribe = subscribeToConversations(
          client.db,
          user.uid,
          (next) => {
            if (!active) return;
            setConversations(next);
            setActiveConversationId(
              (current) => current ?? next[0]?.id ?? null,
            );
            setLoading(false);
          },
          () => {
            if (!active) return;
            setError(
              "Messages are unavailable. Ask the Firebase owner to deploy the included Firestore rules.",
            );
            setLoading(false);
          },
        );
      } catch (caught) {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Messages could not be loaded.",
        );
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [user.uid]);

  useEffect(() => {
    if (!target) return;
    let active = true;

    void (async () => {
      setError("");
      setLoading(true);
      try {
        const client = await getFirebaseClient();
        if (!client) throw new Error("Firebase chat is not configured.");
        const conversationId = await ensureConversation(
          client.db,
          { uid: user.uid, name: currentUserName },
          target,
        );
        if (!active) return;
        setActiveConversationId(conversationId);
        setActiveName(target.name);
      } catch {
        if (!active) return;
        setError(
          "Could not start this conversation. The Firestore chat rules may not be deployed yet.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentUserName, target, user.uid]);

  useEffect(() => {
    if (!activeConversationId) return;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const client = await getFirebaseClient();
        if (!active) return;
        if (!client) throw new Error("Firebase chat is not configured.");

        unsubscribe = subscribeToMessages(
          client.db,
          activeConversationId,
          (next) => {
            if (!active) return;
            setMessageState({
              conversationId: activeConversationId,
              messages: next,
            });
          },
          () => {
            if (!active) return;
            setError("Could not load this conversation.");
          },
        );
      } catch (caught) {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load this conversation.",
        );
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [activeConversationId]);

  const messages = useMemo(
    () =>
      messageState.conversationId === activeConversationId
        ? messageState.messages
        : [],
    [activeConversationId, messageState],
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );

  const threadName = activeConversation
    ? otherParticipant(activeConversation, user.uid).name
    : activeName || "Conversation";

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeConversationId || !draft.trim()) return;

    setSending(true);
    setError("");
    try {
      const client = await getFirebaseClient();
      if (!client) throw new Error("Firebase chat is not configured.");
      await sendChatMessage(
        client.db,
        activeConversationId,
        user.uid,
        draft,
      );
      setDraft("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not send the message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="messages-panel" aria-label="Messages">
      {error && (
        <div className="chat-alert" role="alert">
          {error}
        </div>
      )}
      <div className="chat-shell">
        <aside className="conversation-sidebar">
          <div className="conversation-sidebar-heading">
            <p className="eyebrow">Inbox</p>
            <strong>{conversations.length}</strong>
          </div>
          {loading && !conversations.length ? (
            <p className="conversation-placeholder">Loading messages…</p>
          ) : conversations.length ? (
            <div className="conversation-list">
              {conversations.map((conversation) => {
                const other = otherParticipant(conversation, user.uid);
                return (
                  <button
                    key={conversation.id}
                    className={
                      activeConversationId === conversation.id ? "active" : ""
                    }
                    type="button"
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      setActiveName(other.name);
                    }}
                  >
                    <span className="conversation-avatar">
                      {other.name.charAt(0).toUpperCase() || "W"}
                    </span>
                    <span className="conversation-copy">
                      <strong>{other.name}</strong>
                      <small>
                        {conversation.lastMessage || "Start the conversation"}
                      </small>
                    </span>
                    <time>
                      {formatConversationTime(conversation.updatedAt)}
                    </time>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="conversation-empty">
              <h2>No messages yet.</h2>
              <p>Choose Message on a study-buddy profile to start.</p>
            </div>
          )}
        </aside>

        <div className="chat-thread">
          {activeConversationId ? (
            <>
              <header className="chat-thread-header">
                <span className="conversation-avatar large">
                  {threadName.charAt(0).toUpperCase() || "W"}
                </span>
                <div>
                  <p>Conversation with</p>
                  <h2>{threadName}</h2>
                </div>
              </header>
              <div className="message-log" role="log" aria-live="polite">
                {messages.length ? (
                  messages.map((message) => {
                    const mine = message.senderId === user.uid;
                    return (
                      <article
                        className={`message-bubble ${mine ? "mine" : ""}`}
                        key={message.id}
                      >
                        <p>{message.text}</p>
                        <time>{formatMessageTime(message.createdAt)}</time>
                      </article>
                    );
                  })
                ) : (
                  <div className="message-empty">
                    <h2>Say hello.</h2>
                    <p>Your messages are visible only to this conversation.</p>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>
              <form className="message-composer" onSubmit={submitMessage}>
                <label>
                  <span className="sr-only">Message</span>
                  <textarea
                    maxLength={1000}
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        draft.trim()
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder={`Message ${threadName}`}
                  />
                </label>
                <button
                  className="button primary"
                  type="submit"
                  disabled={sending || !draft.trim()}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-thread-empty">
              <span aria-hidden="true">✦</span>
              <h2>Select a conversation.</h2>
              <p>Or start one from a study-buddy profile.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
