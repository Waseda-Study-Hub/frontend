import type { StudySpot, UserProfile } from "@/types/api";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
  signal?: AbortSignal,
) {
  if (!baseUrl) throw new ApiError(0, "API URL is not configured.");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string | { msg?: string }[];
    } | null;
    const detail = Array.isArray(body?.detail)
      ? body.detail
          .map((item) => item.msg)
          .filter(Boolean)
          .join(", ")
      : body?.detail;
    const fallback: Record<number, string> = {
      401: "Your session has expired. Please sign in again.",
      403: "You do not have permission to do that.",
      404: "The requested item was not found.",
      409: "This action conflicts with an existing record.",
      422: "Please check the highlighted information.",
      429: "Too many requests. Please try again shortly.",
    };
    throw new ApiError(
      response.status,
      typeof detail === "string"
        ? detail
        : (fallback[response.status] ?? "The service is unavailable."),
    );
  }
  return response.json() as Promise<T>;
}

export const api = {
  profile: (uid: string, token?: string, signal?: AbortSignal) =>
    request<UserProfile>(
      `/users/${encodeURIComponent(uid)}`,
      {},
      token,
      signal,
    ),
  saveProfile: (uid: string, value: UserProfile, token?: string) =>
    request<{ status: string; uid: string }>(
      `/users/${encodeURIComponent(uid)}`,
      { method: "POST", body: JSON.stringify(value) },
      token,
    ),
  buddies: (major: string, token?: string, signal?: AbortSignal) =>
    request<UserProfile[]>(
      `/buddies/search?major=${encodeURIComponent(major)}`,
      {},
      token,
      signal,
    ),
  recommendations: (uid: string, token?: string, signal?: AbortSignal) =>
    request<UserProfile[]>(
      `/buddies/recommend/${encodeURIComponent(uid)}`,
      {},
      token,
      signal,
    ),
  spots: (signal?: AbortSignal) =>
    request<StudySpot[]>("/study-spots/", {}, undefined, signal),
  addSpot: (value: StudySpot, token?: string) =>
    request<{ id: string }>(
      "/study-spots/",
      { method: "POST", body: JSON.stringify(value) },
      token,
    ),
};
