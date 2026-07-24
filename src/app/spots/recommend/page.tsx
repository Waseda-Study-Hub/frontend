"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { ProtectedPage } from "@/components/layout/protected-page";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import { studySpotInputSchema, type StudySpotInput } from "@/types/api";

const defaults: StudySpotInput = {
  name: "",
  campus: "",
  building: "",
  floor_or_location: "",
  description: "",
  noise_level: "quiet",
  has_outlets: false,
  has_nearby_restroom: false,
  has_private_room: false,
  food_allowed: false,
  visibility: "public",
};

export default function RecommendPage() {
  const { user, token } = useAuth();
  const client = useQueryClient();
  const form = useForm<StudySpotInput>({
    resolver: zodResolver(studySpotInputSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });
  const contributions = useQuery({
    queryKey: ["spot-contributions", user?.uid],
    enabled: Boolean(user?.emailVerified),
    queryFn: async ({ signal }) =>
      api.mySpots((await token())!, undefined, signal),
  });
  const add = useMutation({
    mutationFn: async (value: StudySpotInput) =>
      api.addSpot(value, (await token())!),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["spots", user?.uid] });
      client.invalidateQueries({
        queryKey: ["spot-contributions", user?.uid],
      });
    },
  });

  if (add.isSuccess) {
    return (
      <ProtectedPage>
        <section className="card success-state">
          <CheckCircle2 aria-hidden="true" />
          <span className="eyebrow">Contribution received</span>
          <h1>Thanks for sharing a study spot</h1>
          {add.data.visibility === "private" ? (
            <p>
              Your contribution is saved privately. It is visible only to your
              account and will not appear in the public directory.
            </p>
          ) : (
            <p>
              Your contribution is saved with a{" "}
              <strong>{add.data.moderation_status}</strong> moderation status.
              It will not appear in the public directory unless it is approved.
            </p>
          )}
          <div className="hero-actions">
            <button
              className="button"
              onClick={() => {
                form.reset(defaults);
                add.reset();
              }}
            >
              Recommend another
            </button>
            <Link className="secondary" href="/spots">
              Back to study spots
            </Link>
          </div>
        </section>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Community contribution</span>
          <h1>Recommend a study spot</h1>
          <p>
            Add practical, accurate campus details. Contributions are moderated
            before public visibility.
          </p>
        </div>
      </div>
      <form
        className="card form-grid contribution-form"
        onSubmit={form.handleSubmit((value) => add.mutate(value))}
        noValidate
      >
        <label className="field">
          Spot name
          <input
            {...form.register("name")}
            placeholder="e.g. Building 3 quiet lounge"
            aria-invalid={Boolean(form.formState.errors.name)}
          />
          {form.formState.errors.name && (
            <span className="field-error">
              {form.formState.errors.name.message}
            </span>
          )}
        </label>
        <label className="field">
          Campus
          <select
            {...form.register("campus")}
            aria-invalid={Boolean(form.formState.errors.campus)}
          >
            <option value="">Choose a campus</option>
            <option>Waseda</option>
            <option>Toyama</option>
            <option>Nishiwaseda</option>
            <option>Tokorozawa</option>
            <option>Other</option>
          </select>
          {form.formState.errors.campus && (
            <span className="field-error">Choose a campus.</span>
          )}
        </label>
        <label className="field">
          Building
          <input
            {...form.register("building")}
            placeholder="Building name or number"
          />
          {form.formState.errors.building && (
            <span className="field-error">
              {form.formState.errors.building.message}
            </span>
          )}
        </label>
        <label className="field">
          Floor or location note <small className="muted">(optional)</small>
          <input
            {...form.register("floor_or_location")}
            placeholder="2nd floor, near the east stairs"
          />
        </label>
        <label className="field span-2">
          Description
          <textarea
            {...form.register("description")}
            placeholder="What makes this useful for studying? Include access context without private codes."
            aria-invalid={Boolean(form.formState.errors.description)}
          />
          <span className="field-meta">
            <span className="field-error">
              {form.formState.errors.description?.message}
            </span>
            <span>{form.watch("description").length}/600</span>
          </span>
        </label>

        <fieldset className="span-2">
          <legend className="label">Noise level</legend>
          <Controller
            control={form.control}
            name="noise_level"
            render={({ field }) => (
              <div className="segmented">
                {[
                  ["quiet", "Quiet"],
                  ["moderate", "Moderate"],
                  ["lively", "Lively"],
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

        <fieldset className="span-2">
          <legend className="label">Amenities</legend>
          <div className="amenity-checks">
            {[
              ["has_outlets", "Electrical outlets"],
              ["has_nearby_restroom", "Restroom nearby"],
              ["has_private_room", "Private room"],
              ["food_allowed", "Food allowed"],
            ].map(([id, label]) => (
              <label className="contact-choice" key={id}>
                <input
                  type="checkbox"
                  {...form.register(id as keyof StudySpotInput)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="span-2">
          <legend className="label">Visibility</legend>
          <div className="radio-cards">
            <label>
              <input
                type="radio"
                value="public"
                {...form.register("visibility")}
              />
              <span>
                <strong>Public after approval</strong>
                <small>Visible in the shared directory once moderated.</small>
              </span>
            </label>
            <label>
              <input
                type="radio"
                value="private"
                {...form.register("visibility")}
              />
              <span>
                <strong>Private contribution</strong>
                <small>
                  Visible only to you; never returned by the public directory.
                </small>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="span-2 privacy-panel">
          Do not include access codes, personal schedules, or identifying
          information about other students.
        </div>
        <div className="span-2 form-actions">
          {add.error && (
            <p className="field-error" role="alert">
              {add.error.message}
            </p>
          )}
          <button
            className="button"
            disabled={add.isPending || form.formState.isSubmitting}
          >
            {add.isPending ? "Saving contribution…" : "Submit recommendation"}
          </button>
        </div>
      </form>
      <section className="card contribution-history">
        <div className="section-title">
          <div>
            <span className="eyebrow">Your contributions</span>
            <h2>Submission status</h2>
          </div>
        </div>
        {contributions.isLoading ? (
          <div
            className="skeleton-block compact-skeleton"
            aria-label="Loading contributions"
          />
        ) : contributions.isError ? (
          <div className="empty-inline" role="alert">
            <p className="field-error">
              Contribution history is temporarily unavailable.
            </p>
            <button
              type="button"
              className="text-link"
              onClick={() => contributions.refetch()}
            >
              Try again
            </button>
          </div>
        ) : contributions.data?.items.length ? (
          <div className="contribution-list">
            {contributions.data.items.map((spot) => (
              <article key={spot.id}>
                <div>
                  <strong>{spot.name}</strong>
                  <span className="muted">
                    {spot.campus} · {spot.visibility}
                  </span>
                </div>
                <span className={`status-badge ${spot.moderation_status}`}>
                  {spot.moderation_status}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">
            Your submitted places and their moderation state will appear here.
          </p>
        )}
      </section>
    </ProtectedPage>
  );
}
