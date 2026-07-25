"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "../lib/firebase";
import {
  addStudySpotComment,
  subscribeToStudySpotComments,
  type StudySpotComment,
} from "../lib/study-spot-comments";
import type { ReportTarget } from "../lib/reports";

type CommentSpot = {
  id: string;
  name: string;
  addedBy: string;
};

type StudySpotCommentsModalProps = {
  user: User;
  currentUserName: string;
  spot: CommentSpot;
  onClose: () => void;
  onReport: (target: ReportTarget) => void;
};

function formatCommentTime(value: Date | null) {
  if (!value) return "Posting…";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default function StudySpotCommentsModal({
  user,
  currentUserName,
  spot,
  onClose,
  onReport,
}: StudySpotCommentsModalProps) {
  const [comments, setComments] = useState<StudySpotComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const client = await getFirebaseClient();
        if (!active) return;
        if (!client) throw new Error("Firebase comments are not configured.");
        unsubscribe = subscribeToStudySpotComments(
          client.db,
          spot.id,
          (next) => {
            if (!active) return;
            setComments(next);
            setLoading(false);
          },
          () => {
            if (!active) return;
            setError("Comments could not be loaded.");
            setLoading(false);
          },
        );
      } catch (caught) {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Comments could not be loaded.",
        );
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [spot.id]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const client = await getFirebaseClient();
      if (!client) throw new Error("Firebase comments are not configured.");
      await addStudySpotComment(
        client.db,
        spot.id,
        user.uid,
        currentUserName,
        draft,
      );
      setDraft("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The comment could not be posted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-card comments-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comments-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close comments"
        >
          ×
        </button>
        <header className="comments-heading">
          <div>
            <p className="eyebrow">Study spot discussion</p>
            <h2 id="comments-title">{spot.name}</h2>
          </div>
          <button
            className="text-danger-button"
            type="button"
            onClick={() => {
              onClose();
              onReport({
                type: "study_spot",
                id: spot.id,
                label: spot.name,
                reportedUserId: spot.addedBy,
              });
            }}
          >
            Report spot
          </button>
        </header>

        <div className="comments-list" aria-live="polite">
          {loading ? (
            <p className="comments-empty">Loading comments…</p>
          ) : comments.length ? (
            comments.map((comment) => (
              <article className="comment-item" key={comment.id}>
                <span className="comment-avatar" aria-hidden="true">
                  {comment.authorName.charAt(0).toUpperCase() || "W"}
                </span>
                <div>
                  <div className="comment-meta">
                    <strong>{comment.authorName}</strong>
                    <time>{formatCommentTime(comment.createdAt)}</time>
                  </div>
                  <p>{comment.text}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="comments-empty">
              No comments yet. Share something useful about this spot.
            </p>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <form className="comment-composer" onSubmit={submitComment}>
          <label>
            <span className="sr-only">Add a comment</span>
            <textarea
              rows={2}
              maxLength={500}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment"
            />
          </label>
          <button
            className="button primary"
            type="submit"
            disabled={submitting || !draft.trim()}
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </form>
      </section>
    </div>
  );
}
