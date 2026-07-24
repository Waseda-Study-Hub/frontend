import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProfileInput, PrivateProfile } from "@/types/api";

const profile: PrivateProfile = {
  uid: "student-1",
  nickname: "Haru",
  full_name: "Haru Waseda",
  school_id: "ug-pse-en",
  year: 2,
  courses: ["Microeconomics"],
  study_styles: ["quiet_study"],
  study_language: "english",
  public_bio: "Looking for a study partner.",
  study_focus: "Microeconomics",
  contacts: { waseda_email: "haru@fuji.waseda.jp" },
  created_at: "2026-07-24T09:00:00Z",
  updated_at: "2026-07-24T09:00:00Z",
};

const profileInput: ProfileInput = {
  nickname: "Haru",
  full_name: "Haru Waseda",
  school_id: "ug-pse-en",
  year: 2,
  courses: ["Microeconomics"],
  study_focus: "Microeconomics",
  study_styles: ["quiet_study"],
  study_language: "english",
  contacts: {
    waseda_email: "haru@fuji.waseda.jp",
    instagram: "",
    discord: "",
    line: "",
  },
  public_bio: "Looking for a study partner.",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

async function loadClient(apiBaseUrl = "https://api.example.test") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", apiBaseUrl);
  return import("./client");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API request transport", () => {
  it("authenticates GET requests without adding a content type", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(profile));
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await loadClient();
    const controller = new AbortController();

    await expect(
      api.profile("firebase-token", controller.signal),
    ).resolves.toEqual(profile);

    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(url).toBe("https://api.example.test/users/me");
    expect(init?.signal).toBe(controller.signal);
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer firebase-token");
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("serializes validated JSON writes with the required headers", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(profile));
    vi.stubGlobal("fetch", fetchMock);
    const { api, toProfilePayload } = await loadClient();

    await api.saveProfile(profileInput, "firebase-token");

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(init?.method).toBe("PUT");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual(
      toProfilePayload(profileInput),
    );
  });

  it("normalizes blank optional profile fields for the backend contract", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(profile));
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await loadClient();

    await api.saveProfile(
      {
        ...profileInput,
        full_name: "",
        public_bio: "",
        contacts: {
          waseda_email: "",
          instagram: "",
          discord: "",
          line: "",
        },
      },
      "firebase-token",
    );

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body).toMatchObject({
      full_name: null,
      public_bio: null,
      contacts: {
        waseda_email: null,
        instagram: null,
        discord: null,
        line: null,
      },
    });
  });

  it("encodes buddy filters instead of interpolating unsafe query text", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        items: [],
        next_cursor: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await loadClient();

    await api.buddies(
      {
        q: "law & economics",
        school_id: "grad-law-en",
        limit: 20,
      },
      "firebase-token",
    );

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/buddies/search");
    expect(url.searchParams.get("q")).toBe("law & economics");
    expect(url.searchParams.get("school_id")).toBe("grad-law-en");
    expect(url.searchParams.get("limit")).toBe("20");
  });

  it("keeps abort errors distinct from connectivity failures", async () => {
    const abortError = new DOMException("cancelled", "AbortError");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(abortError));
    const { api, ApiError } = await loadClient();

    const result = api.profile("firebase-token");

    await expect(result).rejects.toBe(abortError);
    await expect(result).rejects.not.toBeInstanceOf(ApiError);
  });
});

describe("API error handling", () => {
  it("classifies network failures without exposing transport details", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockRejectedValue(new Error("getaddrinfo ENOTFOUND internal-host")),
    );
    const { api, ApiError } = await loadClient();

    const error = await api.profile("firebase-token").catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, kind: "network" });
    expect(error.message).not.toContain("internal-host");
  });

  it("maps structured FastAPI validation errors to fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            detail: [
              {
                loc: ["body", "nickname"],
                msg: "String should have at least 2 characters",
                type: "string_too_short",
              },
            ],
          },
          422,
        ),
      ),
    );
    const { api, ApiError } = await loadClient();

    const error = await api
      .saveProfile(profileInput, "firebase-token")
      .catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      kind: "validation",
      fieldErrors: {
        nickname: "String should have at least 2 characters",
      },
    });
  });

  it("does not expose a plain-text backend exception", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response("serviceAccountKey.json failed: secret-value", {
          status: 500,
          headers: { "content-type": "text/plain" },
        }),
      ),
    );
    const { api, ApiError } = await loadClient();

    const error = await api.profile("firebase-token").catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, kind: "server" });
    expect(error.message).not.toContain("serviceAccountKey");
    expect(error.message).not.toContain("secret-value");
  });

  it("rejects a malformed successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ uid: 42 })),
    );
    const { api, ApiError } = await loadClient();

    const error = await api.profile("firebase-token").catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 200, kind: "invalid-response" });
  });

  it("fails honestly when the API URL is missing", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const { api, ApiError } = await import("./client");

    const error = await api.profile("firebase-token").catch((value) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, kind: "configuration" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
