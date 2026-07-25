"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "../lib/firebase";
import {
  reportReasons,
  submitReport,
  type ReportReason,
  type ReportTarget,
} from "../lib/reports";

type ReportModalProps = {
  user: User;
  target: ReportTarget;
  onClose: () => void;
  onReported: () => void;
};

export default function ReportModal({
  user,
  target,
  onClose,
  onReported,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>(reportReasons[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const client = await getFirebaseClient();
      if (!client) throw new Error("Firebase reports are not configured.");
      await submitReport(client.db, user.uid, target, reason, details);
      onReported();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The report could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-card report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close report form"
        >
          ×
        </button>
        <p className="eyebrow">Report</p>
        <h2 id="report-title">{target.label}</h2>
        <p className="modal-intro">
          Reports are sent privately for review. The reported member will not
          see who submitted it.
        </p>
        <form className="report-form" onSubmit={handleSubmit}>
          <label>
            Reason
            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as ReportReason)
              }
            >
              {reportReasons.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Details (optional)
            <textarea
              rows={4}
              maxLength={500}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Briefly explain what happened."
            />
            <small>{details.length}/500</small>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Submit report"}
          </button>
        </form>
      </section>
    </div>
  );
}
