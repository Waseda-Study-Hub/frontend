"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedPage } from "@/components/layout/protected-page";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import type { StudySpot } from "@/types/api";

const options = [
  "Quiet",
  "Group-friendly",
  "Outlets",
  "Restrooms",
  "Food allowed",
  "Private rooms",
];
export default function RecommendPage() {
  const { user, token } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState<Omit<StudySpot, "added_by">>({
    name: "",
    location: "",
    description: "",
    labels: [],
    is_public: true,
  });
  const add = useMutation({
    mutationFn: async () =>
      api.addSpot({ ...form, added_by: user!.uid }, await token()),
    onSuccess: () => client.invalidateQueries({ queryKey: ["spots"] }),
  });
  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Community contribution</span>
          <h1>Recommend a study spot</h1>
          <p>
            The current backend publishes accepted submissions immediately and
            has no moderation status. Submit only accurate, non-sensitive
            location information.
          </p>
        </div>
      </div>
      <form
        className="card form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          if (!user) return;
          add.mutate();
        }}
      >
        <label className="field">
          Spot name
          <input
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="field">
          Building, floor, location
          <input
            required
            maxLength={160}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </label>
        <label className="field span-2">
          Description
          <textarea
            required
            maxLength={500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <fieldset className="span-2">
          <legend className="label">Amenities and atmosphere</legend>
          <div className="tags">
            {options.map((x) => (
              <label className="pill" key={x}>
                <input
                  type="checkbox"
                  checked={form.labels.includes(x)}
                  onChange={() =>
                    setForm({
                      ...form,
                      labels: form.labels.includes(x)
                        ? form.labels.filter((v) => v !== x)
                        : [...form.labels, x],
                    })
                  }
                />
                {x}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="span-2">
          <div className="notice">
            Do not include access codes, personal schedules, or private-room
            details.
          </div>
          {add.error && <p className="error">{add.error.message}</p>}
          {add.isSuccess && <p className="success">Study spot submitted.</p>}
          <button className="button" disabled={add.isPending || !user}>
            {add.isPending ? "Submitting…" : "Submit recommendation"}
          </button>
        </div>
      </form>
    </ProtectedPage>
  );
}
