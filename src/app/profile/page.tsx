"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { ProtectedPage } from "@/components/layout/protected-page";
import { SchoolSelector } from "@/components/ui/school-selector";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError, api } from "@/lib/api/client";
import { findSchool } from "@/lib/constants/schools";
import {
  profileInputSchema,
  type ProfileInput,
  type PrivateProfile,
} from "@/types/api";

const studyStyles = [
  ["quiet_study", "Quiet Study"],
  ["active_discussion", "Active Discussion"],
  ["morning_person", "Morning Person"],
  ["afternoon_person", "Afternoon Person"],
  ["evening_night", "Evening / Night"],
  ["group_study", "Group Study"],
  ["one_on_one", "1-on-1 Study"],
] as const;

const defaults: ProfileInput = {
  nickname: "",
  full_name: "",
  school_id: "",
  year: 1,
  courses: [],
  study_focus: "",
  study_styles: [],
  study_language: "english",
  contacts: { waseda_email: "", instagram: "", discord: "", line: "" },
  public_bio: "",
};

function toForm(profile: PrivateProfile): ProfileInput {
  return {
    nickname: profile.nickname,
    full_name: profile.full_name ?? "",
    school_id: profile.school_id,
    year: profile.year,
    courses: profile.courses,
    study_focus: profile.study_focus ?? "",
    study_styles: profile.study_styles,
    study_language: profile.study_language,
    contacts: {
      waseda_email: profile.contacts.waseda_email ?? "",
      instagram: profile.contacts.instagram ?? "",
      discord: profile.contacts.discord ?? "",
      line: profile.contacts.line ?? "",
    },
    public_bio: profile.public_bio ?? "",
  };
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const client = useQueryClient();
  const [courseDraft, setCourseDraft] = useState("");
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });
  const profile = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: Boolean(user?.emailVerified),
    queryFn: async ({ signal }) => api.profile((await token())!, signal),
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 404) && count < 1,
  });
  const onboarding =
    profile.error instanceof ApiError && profile.error.status === 404;
  const preview = form.watch();
  const previewSchool = findSchool(preview.school_id);

  useEffect(() => {
    if (profile.data) {
      const values = toForm(profile.data);
      form.reset({
        ...values,
        contacts: {
          ...values.contacts,
          waseda_email: values.contacts.waseda_email || user?.email || "",
        },
      });
    }
  }, [form, profile.data, user?.email]);

  useEffect(() => {
    if (onboarding && user?.email && !form.getValues("contacts.waseda_email")) {
      form.setValue("contacts.waseda_email", user.email, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [form, onboarding, user?.email]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form.formState.isDirty]);

  const save = useMutation({
    mutationFn: async (value: ProfileInput) =>
      api.saveProfile(value, (await token())!),
    onSuccess: (value) => {
      form.reset(toForm(value));
      client.setQueryData(["profile", user?.uid], value);
    },
  });

  const addCourse = () => {
    const value = courseDraft.trim();
    const existing = form.getValues("courses");
    if (!value || existing.length >= 3 || existing.includes(value)) return;
    form.setValue("courses", [...existing, value], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setCourseDraft("");
  };

  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">
            {onboarding ? "First-time setup" : "Academic identity"}
          </span>
          <h1>{onboarding ? "Build your study profile" : "Your profile"}</h1>
          <p>
            Share only the academic context other students need. Contact details
            remain private until you accept a study request.
          </p>
        </div>
        {form.formState.isDirty && (
          <span className="status-badge warning">Unsaved changes</span>
        )}
      </div>

      {profile.isLoading ? (
        <div className="card skeleton-block" aria-label="Loading profile" />
      ) : profile.isError && !onboarding ? (
        <div className="card error-panel" role="alert">
          <h2>We couldn’t load your profile</h2>
          <p>{profile.error.message}</p>
          <button className="secondary" onClick={() => profile.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <form
          className="card form-grid profile-form"
          onSubmit={form.handleSubmit((value) => save.mutate(value))}
          noValidate
        >
          <label className="field">
            Nickname
            <input
              {...form.register("nickname")}
              autoComplete="nickname"
              aria-invalid={Boolean(form.formState.errors.nickname)}
            />
            {form.formState.errors.nickname && (
              <span className="field-error">
                {form.formState.errors.nickname.message}
              </span>
            )}
          </label>
          <label className="field">
            Full name <small className="muted">(optional and private)</small>
            <input {...form.register("full_name")} autoComplete="name" />
          </label>

          <label className="field">
            Academic year
            <select
              {...form.register("year", { valueAsNumber: true })}
              aria-invalid={Boolean(form.formState.errors.year)}
            >
              <option value={1}>1st year</option>
              <option value={2}>2nd year</option>
              <option value={3}>3rd year</option>
              <option value={4}>4th year</option>
              <option value={5}>Graduate — 1st year</option>
              <option value={6}>Graduate — 2nd year</option>
              <option value={7}>Graduate — 3rd year</option>
              <option value={8}>Graduate — 4th year or later</option>
            </select>
          </label>
          <Controller
            control={form.control}
            name="school_id"
            render={({ field, fieldState }) => (
              <div>
                <SchoolSelector value={field.value} onChange={field.onChange} />
                {fieldState.error && (
                  <span className="field-error">
                    {fieldState.error.message}
                  </span>
                )}
              </div>
            )}
          />

          <div className="field span-2">
            <span className="label">Active courses</span>
            <div className="course-row">
              <input
                value={courseDraft}
                maxLength={80}
                placeholder="Course name or code"
                onChange={(event) => setCourseDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCourse();
                  }
                }}
              />
              <button
                type="button"
                className="secondary"
                disabled={
                  !courseDraft.trim() || form.watch("courses").length >= 3
                }
                onClick={addCourse}
              >
                <Plus aria-hidden="true" /> Add
              </button>
            </div>
            <div className="tags">
              {form.watch("courses").map((course, index) => (
                <button
                  type="button"
                  className="pill removable"
                  key={course}
                  onClick={() => {
                    const next = form
                      .getValues("courses")
                      .filter((_, itemIndex) => itemIndex !== index);
                    form.setValue("courses", next, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  aria-label={`Remove ${course}`}
                >
                  {course} <X aria-hidden="true" />
                </button>
              ))}
            </div>
            <small className="muted">
              {form.watch("courses").length}/3 courses
            </small>
          </div>

          <label className="field span-2">
            Main study focus
            <textarea
              {...form.register("study_focus")}
              placeholder="What are you hoping to make progress on?"
            />
            {form.formState.errors.study_focus && (
              <span className="field-error">
                {form.formState.errors.study_focus.message}
              </span>
            )}
          </label>

          <fieldset className="span-2">
            <legend className="label">Study style</legend>
            <Controller
              control={form.control}
              name="study_styles"
              render={({ field }) => (
                <div className="choice-pills">
                  {studyStyles.map(([id, label]) => {
                    const selected = field.value.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((value) => value !== id)
                              : [...field.value, id],
                          )
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {form.formState.errors.study_styles && (
              <span className="field-error">
                Choose at least one study style.
              </span>
            )}
          </fieldset>

          <fieldset className="span-2">
            <legend className="label">Preferred study language</legend>
            <Controller
              control={form.control}
              name="study_language"
              render={({ field }) => (
                <div className="segmented">
                  {[
                    ["english", "English"],
                    ["japanese", "Japanese"],
                    ["bilingual", "Bilingual"],
                  ].map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={field.value === id}
                      onClick={() => field.onChange(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            />
          </fieldset>

          <div className="span-2 privacy-panel">
            <strong>Contact details stay private</strong>
            <p>
              These values are revealed only to an accepted study connection,
              and only for the methods you select in that request.
            </p>
          </div>
          <label className="field">
            Waseda email
            <input
              {...form.register("contacts.waseda_email")}
              type="email"
              autoComplete="email"
              readOnly
            />
            <small className="muted">Uses your verified sign-in address.</small>
          </label>
          <label className="field">
            Instagram
            <input {...form.register("contacts.instagram")} />
          </label>
          <label className="field">
            Discord
            <input {...form.register("contacts.discord")} />
          </label>
          <label className="field">
            LINE
            <input {...form.register("contacts.line")} />
          </label>
          <label className="field span-2">
            Public bio <small className="muted">(optional)</small>
            <textarea {...form.register("public_bio")} />
          </label>

          <section
            className="span-2 profile-preview"
            aria-label="Public profile preview"
          >
            <div className="buddy-topline">
              <span className="avatar" aria-hidden="true">
                {(preview.nickname || "You").slice(0, 2).toUpperCase()}
              </span>
              <span className="status-dot">
                Public academic profile preview
              </span>
            </div>
            <h2>{preview.nickname || "Your nickname"}</h2>
            <p className="muted">
              {previewSchool?.abbreviation ?? "School"} · Year {preview.year}
            </p>
            <div className="tags">
              {preview.courses.length ? (
                preview.courses.map((course) => (
                  <span className="pill" key={course}>
                    {course}
                  </span>
                ))
              ) : (
                <span className="muted">Your public courses appear here.</span>
              )}
            </div>
            {preview.public_bio && <p>{preview.public_bio}</p>}
            <small className="muted">
              Full name and contact details are never included in this public
              preview.
            </small>
          </section>

          <div className="span-2 form-actions">
            {save.error && (
              <p className="field-error" role="alert">
                {save.error.message}
              </p>
            )}
            {save.isSuccess && (
              <p className="success" role="status">
                Profile saved.
              </p>
            )}
            <button
              className="button"
              disabled={save.isPending || !form.formState.isDirty}
            >
              {save.isPending
                ? "Saving…"
                : onboarding
                  ? "Complete profile"
                  : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </ProtectedPage>
  );
}
