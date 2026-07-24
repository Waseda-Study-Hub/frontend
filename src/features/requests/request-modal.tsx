"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError, api } from "@/lib/api/client";
import type { ContactMethod, PrivateProfile, PublicProfile } from "@/types/api";

const requestFormSchema = z.object({
  topic: z.string().trim().max(100).optional(),
  message: z.string().trim().min(10, "Write at least 10 characters.").max(500),
  contact_methods: z
    .array(z.enum(["waseda_email", "instagram", "discord", "line"]))
    .min(1, "Choose at least one contact method."),
});
type RequestForm = z.infer<typeof requestFormSchema>;

const methodLabels = {
  waseda_email: "Waseda email",
  instagram: "Instagram",
  discord: "Discord",
  line: "LINE",
} as const;
const methodEntries = Object.entries(methodLabels) as Array<
  [ContactMethod, string]
>;

function availableContactMethods(profile: PrivateProfile | undefined) {
  if (!profile) return [];
  return methodEntries
    .filter(([method]) => Boolean(profile.contacts[method]))
    .map(([method]) => method);
}

export function RequestModal({
  recipient,
  open,
  onClose,
}: {
  recipient: PublicProfile | null;
  open: boolean;
  onClose(): void;
}) {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [sent, setSent] = useState(false);
  const profile = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: Boolean(open && user?.emailVerified),
    queryFn: async ({ signal }) => api.profile((await token())!, signal),
  });
  const availableMethods = availableContactMethods(profile.data);
  const form = useForm<RequestForm>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      topic: recipient?.courses[0] ?? "",
      message: "",
      contact_methods: ["waseda_email"],
    },
  });

  useEffect(() => {
    if (!open) {
      if (dialog.current?.open) dialog.current.close();
      return;
    }
    setSent(false);
    const defaults = availableContactMethods(profile.data);
    form.reset({
      topic: recipient?.courses[0] ?? "",
      message: "",
      contact_methods: defaults.includes("waseda_email")
        ? ["waseda_email"]
        : defaults.slice(0, 1),
    });
    dialog.current?.showModal();
  }, [form, open, profile.data, recipient]);

  const send = useMutation({
    mutationFn: async (value: RequestForm) => {
      if (!recipient || !user) throw new Error("Choose a student first.");
      return api.createRequest(
        {
          recipient_uid: recipient.uid,
          topic: value.topic || undefined,
          message: value.message,
          contact_methods: value.contact_methods,
        },
        (await token())!,
      );
    },
    onSuccess: () => {
      setSent(true);
      queryClient.invalidateQueries({ queryKey: ["requests", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["buddies", user?.uid] });
    },
  });

  const close = () => {
    onClose();
    if (dialog.current?.open) dialog.current.close();
  };

  return (
    <dialog
      className="request-dialog"
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!send.isPending) close();
      }}
      onClose={onClose}
    >
      <div className="dialog-head">
        <div>
          <span className="eyebrow">Privacy-first request</span>
          <h2 id={titleId}>
            {sent ? "Request sent" : `Study with ${recipient?.nickname ?? ""}`}
          </h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Close request"
          onClick={close}
          disabled={send.isPending}
        >
          <X aria-hidden="true" />
        </button>
      </div>
      {sent ? (
        <div className="dialog-body stack" role="status">
          <div className="status-icon success-icon">✓</div>
          <p>
            Your request is now pending. Contact details remain hidden unless
            the request is accepted.
          </p>
          <button className="button" onClick={close}>
            Done
          </button>
        </div>
      ) : (
        <form
          className="dialog-body stack"
          onSubmit={form.handleSubmit((value) => send.mutate(value))}
          noValidate
        >
          <div className="recipient-summary">
            <span className="avatar" aria-hidden="true">
              {recipient?.nickname.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{recipient?.nickname}</strong>
              <span>
                {recipient?.school_id} · Year {recipient?.year}
              </span>
            </div>
          </div>
          <label className="field">
            Shared course or topic
            <input
              {...form.register("topic")}
              placeholder="What would you like to study?"
            />
          </label>
          <label className="field">
            Message
            <textarea
              {...form.register("message")}
              placeholder="Introduce yourself and suggest what you could work on together."
              aria-invalid={Boolean(form.formState.errors.message)}
            />
            <span className="field-meta">
              <span className="field-error">
                {form.formState.errors.message?.message}
              </span>
              <span>{form.watch("message").length}/500</span>
            </span>
          </label>
          <fieldset>
            <legend className="label">Share after acceptance</legend>
            <div className="contact-grid">
              {methodEntries.map(([id, label]) => {
                const selected = form.watch("contact_methods").includes(id);
                const available = availableMethods.includes(id);
                return (
                  <label className="contact-choice" key={id}>
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!available}
                      onChange={() => {
                        const values = form.getValues("contact_methods");
                        form.setValue(
                          "contact_methods",
                          selected
                            ? values.filter((value) => value !== id)
                            : [...values, id],
                          { shouldValidate: true },
                        );
                      }}
                    />
                    {label}
                    {!available && <small>Not set in profile</small>}
                  </label>
                );
              })}
            </div>
            {form.formState.errors.contact_methods && (
              <span className="field-error">
                {form.formState.errors.contact_methods.message}
              </span>
            )}
          </fieldset>
          <div className="privacy-panel">
            <strong>Nothing is revealed now.</strong>
            <p>
              Only your selected methods can be returned by the API after both
              students are connected.
            </p>
          </div>
          {!profile.isLoading && !availableMethods.length && (
            <p className="field-error" role="alert">
              Add at least one contact method to your{" "}
              <Link href="/profile" onClick={close}>
                profile
              </Link>{" "}
              before sending a request.
            </p>
          )}
          {profile.isError && (
            <p className="field-error" role="alert">
              We could not verify your configured contact methods.
            </p>
          )}
          {send.error && (
            <p className="field-error" role="alert">
              {send.error instanceof ApiError && send.error.status === 409
                ? "You already have a pending request with this student."
                : send.error.message}
            </p>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary"
              onClick={close}
              disabled={send.isPending}
            >
              Cancel
            </button>
            <button
              className="button"
              disabled={
                send.isPending ||
                profile.isLoading ||
                profile.isError ||
                !availableMethods.length
              }
            >
              {send.isPending ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

export { requestFormSchema };
