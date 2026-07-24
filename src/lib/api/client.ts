import { z, type ZodType } from "zod";
import {
  connectionContactSchema,
  privateProfileSchema,
  profileInputSchema,
  publicProfileSchema,
  requestListSchema,
  requestSummarySchema,
  studySpotInputSchema,
  studySpotListSchema,
  studySpotPrivateListSchema,
  studySpotPrivateSchema,
  studySpotSchema,
  type ProfileInput,
  type ContactMethod,
  type StudySpotInput,
} from "@/types/api";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export type ApiErrorKind =
  | "configuration"
  | "network"
  | "authentication"
  | "authorization"
  | "validation"
  | "conflict"
  | "not-found"
  | "rate-limit"
  | "server"
  | "invalid-response";

export class ApiError extends Error {
  constructor(
    public status: number,
    public kind: ApiErrorKind,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const safeMessages: Record<number, { kind: ApiErrorKind; message: string }> = {
  400: {
    kind: "validation",
    message: "Please check the information and try again.",
  },
  401: {
    kind: "authentication",
    message: "Your session has expired. Please sign in again.",
  },
  403: {
    kind: "authorization",
    message: "You do not have permission to do that.",
  },
  404: { kind: "not-found", message: "The requested item was not found." },
  409: {
    kind: "conflict",
    message: "This action conflicts with an existing record.",
  },
  422: {
    kind: "validation",
    message: "Please check the highlighted information.",
  },
  429: {
    kind: "rate-limit",
    message: "Too many requests. Please try again shortly.",
  },
};

function validationFields(value: unknown) {
  const result: Record<string, string> = {};
  if (!value || typeof value !== "object" || !("detail" in value))
    return result;
  const detail = (value as { detail?: unknown }).detail;
  if (!Array.isArray(detail)) return result;
  for (const item of detail) {
    if (!item || typeof item !== "object") continue;
    const location = "loc" in item && Array.isArray(item.loc) ? item.loc : [];
    const message =
      "msg" in item && typeof item.msg === "string" ? item.msg : "";
    if (message) result[String(location.at(-1) ?? "form")] = message;
  }
  return result;
}

async function request<T>(
  path: string,
  schema: ZodType<T>,
  init: RequestInit = {},
  token?: string,
  signal?: AbortSignal,
): Promise<T> {
  if (!baseUrl)
    throw new ApiError(0, "configuration", "The API URL is not configured.");

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      0,
      "network",
      "We could not reach the Study Hub service. Check your connection and try again.",
    );
  }

  if (response.status === 204) return schema.parse(undefined);

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const fallback = safeMessages[response.status] ?? {
      kind: "server" as const,
      message: "The Study Hub service is temporarily unavailable.",
    };
    throw new ApiError(
      response.status,
      fallback.kind,
      fallback.message,
      validationFields(body),
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      response.status,
      "invalid-response",
      "The service returned an unexpected response. Please try again later.",
    );
  }
  return parsed.data;
}

const queryString = (
  values: Record<string, string | number | boolean | undefined>,
) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : "";
};

export function toProfilePayload(value: ProfileInput) {
  const parsed = profileInputSchema.parse(value);
  const optional = (text: string | undefined) => text || null;

  return {
    ...parsed,
    full_name: optional(parsed.full_name),
    study_focus: optional(parsed.study_focus),
    public_bio: optional(parsed.public_bio),
    contacts: {
      waseda_email: optional(parsed.contacts.waseda_email),
      instagram: optional(parsed.contacts.instagram),
      discord: optional(parsed.contacts.discord),
      line: optional(parsed.contacts.line),
    },
  };
}

export type BuddyFilters = {
  q?: string;
  school_id?: string;
  year?: string;
  study_style?: string;
  study_language?: string;
  cursor?: string;
  limit?: number;
};

export const api = {
  profile: (token: string, signal?: AbortSignal) =>
    request("/users/me", privateProfileSchema, {}, token, signal),
  saveProfile: (value: ProfileInput, token: string) =>
    request(
      "/users/me",
      privateProfileSchema,
      { method: "PUT", body: JSON.stringify(toProfilePayload(value)) },
      token,
    ),
  buddies: (filters: BuddyFilters, token: string, signal?: AbortSignal) =>
    request(
      `/buddies/search${queryString(filters)}`,
      z.object({
        items: z.array(publicProfileSchema),
        next_cursor: z.string().nullable().optional(),
      }),
      {},
      token,
      signal,
    ),
  requests: (
    box: "incoming" | "sent" | "connected",
    token: string,
    cursor?: string,
    signal?: AbortSignal,
  ) =>
    request(
      `/requests${queryString({ box, cursor, limit: 20 })}`,
      requestListSchema,
      {},
      token,
      signal,
    ),
  createRequest: (
    value: {
      recipient_uid: string;
      topic?: string;
      message: string;
      contact_methods: ContactMethod[];
    },
    token: string,
  ) =>
    request(
      "/requests",
      requestSummarySchema,
      { method: "POST", body: JSON.stringify(value) },
      token,
    ),
  transitionRequest: (
    id: string,
    action: "accept" | "decline" | "cancel",
    token: string,
    contactMethods?: ContactMethod[],
  ) =>
    request(
      `/requests/${encodeURIComponent(id)}/${action}`,
      requestSummarySchema,
      {
        method: "POST",
        ...(action === "accept"
          ? { body: JSON.stringify({ contact_methods: contactMethods ?? [] }) }
          : {}),
      },
      token,
    ),
  connection: (id: string, token: string, signal?: AbortSignal) =>
    request(
      `/requests/${encodeURIComponent(id)}/connection`,
      connectionContactSchema,
      {},
      token,
      signal,
    ),
  spots: (
    filters: Record<string, string | number | boolean | undefined>,
    token: string,
    signal?: AbortSignal,
  ) =>
    request(
      `/study-spots/${queryString(filters)}`,
      studySpotListSchema,
      {},
      token,
      signal,
    ),
  spot: (id: string, token: string, signal?: AbortSignal) =>
    request(
      `/study-spots/${encodeURIComponent(id)}`,
      studySpotSchema,
      {},
      token,
      signal,
    ),
  addSpot: (value: StudySpotInput, token: string) =>
    request(
      "/study-spots/",
      studySpotPrivateSchema,
      {
        method: "POST",
        body: JSON.stringify(studySpotInputSchema.parse(value)),
      },
      token,
    ),
  mySpots: (token: string, cursor?: string, signal?: AbortSignal) =>
    request(
      `/study-spots/mine${queryString({ cursor, limit: 20 })}`,
      studySpotPrivateListSchema,
      {},
      token,
      signal,
    ),
  reportCrowd: (
    id: string,
    status: "quiet" | "moderate" | "busy" | "full",
    token: string,
  ) =>
    request(
      `/study-spots/${encodeURIComponent(id)}/crowd-reports`,
      z.object({
        id: z.string(),
        status: z.enum(["quiet", "moderate", "busy", "full"]),
        reported_at: z.string(),
        freshness: z.enum(["fresh", "recent", "stale"]),
      }),
      { method: "POST", body: JSON.stringify({ status }) },
      token,
    ),
};
