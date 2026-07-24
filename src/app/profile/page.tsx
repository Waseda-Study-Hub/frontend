"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedPage } from "@/components/layout/protected-page";
import { SchoolSelector } from "@/components/ui/school-selector";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import { findSchool } from "@/lib/constants/schools";
import type { UserProfile } from "@/types/api";

const blank: UserProfile = {
  username: "",
  full_name: "",
  year: 1,
  major: "",
  courses: [],
  availability_slots: [],
  bio: "",
  instagram_tag: "",
};

export default function ProfilePage() {
  const { user, token } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState(blank);
  const [schoolId, setSchoolId] = useState("");
  const [course, setCourse] = useState("");
  const profile = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: Boolean(user),
    queryFn: async ({ signal }) =>
      api.profile(user!.uid, await token(), signal),
    retry: false,
  });
  useEffect(() => {
    if (profile.data) {
      setForm(profile.data);
      const match = findSchool(profile.data.major);
      setSchoolId(match?.id ?? "");
    }
  }, [profile.data]);
  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save.");
      const school = findSchool(schoolId);
      if (!school) throw new Error("Choose your school.");
      return api.saveProfile(
        user.uid,
        { ...form, major: school.name },
        await token(),
      );
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["profile", user?.uid] }),
  });
  return (
    <ProtectedPage>
      <div className="page-head">
        <div>
          <span className="eyebrow">Academic identity</span>
          <h1>Your profile</h1>
          <p>
            Only academic information appears in discovery. The current backend
            supports Instagram as an optional field but does not safely share it
            after acceptance, so it stays private.
          </p>
        </div>
      </div>
      <form
        className="card form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <label className="field">
          Nickname
          <input
            required
            maxLength={40}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </label>
        <label className="field">
          Full name
          <input
            required
            maxLength={100}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </label>
        <label className="field">
          Academic year
          <select
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <SchoolSelector value={schoolId} onChange={setSchoolId} />
        <div className="field span-2">
          <span className="label">Current courses</span>
          <div className="course-row">
            <input
              value={course}
              maxLength={80}
              placeholder="Course name or code"
              onChange={(e) => setCourse(e.target.value)}
            />
            <button
              type="button"
              className="secondary"
              disabled={!course.trim() || form.courses.length >= 10}
              onClick={() => {
                setForm({ ...form, courses: [...form.courses, course.trim()] });
                setCourse("");
              }}
            >
              Add
            </button>
          </div>
          <div className="tags">
            {form.courses.map((c) => (
              <button
                type="button"
                className="pill"
                key={c}
                onClick={() =>
                  setForm({
                    ...form,
                    courses: form.courses.filter((x) => x !== c),
                  })
                }
              >
                {c} ×
              </button>
            ))}
          </div>
          <small className="muted">{form.courses.length}/10 courses</small>
        </div>
        <label className="field span-2">
          Study focus / bio
          <textarea
            maxLength={500}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </label>
        <label className="field">
          Instagram (private)
          <input
            value={form.instagram_tag ?? ""}
            onChange={(e) =>
              setForm({ ...form, instagram_tag: e.target.value })
            }
          />
        </label>
        <label className="field">
          Availability notes
          <input
            value={form.availability_slots.join(", ")}
            onChange={(e) =>
              setForm({
                ...form,
                availability_slots: e.target.value
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <div className="span-2">
          {save.error && (
            <p className="error" role="alert">
              {save.error.message}
            </p>
          )}
          {save.isSuccess && (
            <p className="success" role="status">
              Profile saved.
            </p>
          )}
          <button className="button" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </ProtectedPage>
  );
}
