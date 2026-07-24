import { expect, type Page, type Route } from "@playwright/test";

export const E2E_USER = {
  uid: "e2e-student-1",
  email: "haru@fuji.waseda.jp",
  password: "study-hub-password",
  nickname: "Haru",
};

export const OTHER_STUDENT = {
  uid: "e2e-student-2",
  nickname: "Aoi",
  school_id: "ug-pse-en",
  year: 2,
  courses: ["Microeconomics", "Statistics"],
  study_styles: ["quiet_study", "morning_person"],
  study_language: "english",
  public_bio: "Reviewing microeconomics before finals.",
  match_reason: "2 shared courses",
};

export const PRIVATE_SPOT_NAME = "Author-only research room";

const currentSeconds = () => Math.floor(Date.now() / 1000);

function idToken(verified: boolean) {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      aud: "study-hub-e2e",
      auth_time: currentSeconds(),
      email: E2E_USER.email,
      email_verified: verified,
      exp: currentSeconds() + 3_600,
      firebase: {
        identities: { email: [E2E_USER.email] },
        sign_in_provider: "password",
      },
      iat: currentSeconds(),
      iss: "https://securetoken.google.com/study-hub-e2e",
      sub: E2E_USER.uid,
      user_id: E2E_USER.uid,
    }),
  ).toString("base64url");
  return `${header}.${payload}.e2e-signature`;
}

const firebaseUser = (verified: boolean) => ({
  localId: E2E_USER.uid,
  email: E2E_USER.email,
  emailVerified: verified,
  displayName: E2E_USER.nickname,
  providerUserInfo: [],
  validSince: "0",
  lastLoginAt: String(Date.now()),
  createdAt: String(Date.now()),
});

async function firebaseRoute(route: Route, verified: boolean) {
  const url = new URL(route.request().url());
  const path = url.pathname;
  const token = idToken(verified);

  if (path.endsWith("/accounts:signInWithPassword")) {
    await route.fulfill({
      json: {
        kind: "identitytoolkit#VerifyPasswordResponse",
        ...firebaseUser(verified),
        idToken: token,
        registered: true,
        refreshToken: "e2e-refresh-token",
        expiresIn: "3600",
      },
    });
    return;
  }

  if (path.endsWith("/accounts:lookup")) {
    await route.fulfill({ json: { users: [firebaseUser(verified)] } });
    return;
  }

  if (
    path.endsWith("/accounts:sendOobCode") ||
    path.endsWith("/accounts:update")
  ) {
    await route.fulfill({ json: { email: E2E_USER.email } });
    return;
  }

  if (path.endsWith("/accounts:signUp")) {
    await route.fulfill({
      json: {
        ...firebaseUser(false),
        idToken: idToken(false),
        refreshToken: "e2e-refresh-token",
        expiresIn: "3600",
      },
    });
    return;
  }

  if (path.endsWith("/projects")) {
    await route.fulfill({
      json: { authorizedDomains: ["127.0.0.1", "localhost"] },
    });
    return;
  }

  await route.fulfill({ json: {} });
}

export async function installFirebaseMock(
  page: Page,
  options: { verified?: boolean } = {},
) {
  const verified = options.verified ?? true;

  await page.route("**/identitytoolkit.googleapis.com/**", (route) =>
    firebaseRoute(route, verified),
  );
  await page.route("**/securetoken.googleapis.com/**", async (route) => {
    await route.fulfill({
      json: {
        access_token: idToken(verified),
        expires_in: "3600",
        token_type: "Bearer",
        refresh_token: "e2e-refresh-token",
        id_token: idToken(verified),
        user_id: E2E_USER.uid,
        project_id: "study-hub-e2e",
      },
    });
  });
  await page.route("**/test.firebaseapp.com/**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Firebase test auth helper</title>",
    });
  });
}

const privateProfile = {
  uid: E2E_USER.uid,
  nickname: E2E_USER.nickname,
  full_name: "Haru Waseda",
  school_id: "ug-pse-en",
  year: 2,
  courses: ["Microeconomics", "Statistics"],
  study_styles: ["quiet_study", "morning_person"],
  study_language: "english",
  public_bio: "Reviewing microeconomics before finals.",
  study_focus: "Microeconomics final",
  contacts: {
    waseda_email: E2E_USER.email,
    instagram: "@haru_studies",
    discord: null,
    line: null,
  },
  created_at: "2026-07-24T08:00:00Z",
  updated_at: "2026-07-24T09:00:00Z",
};

const publicSpots = [
  {
    id: "spot-1",
    name: "Building 3 Study Commons",
    campus: "Waseda",
    building: "Building 3",
    floor_or_location: "2F",
    description: "A quiet shared study area near the central staircase.",
    noise_level: "quiet",
    has_outlets: true,
    has_nearby_restroom: true,
    has_private_room: false,
    food_allowed: false,
    latest_crowd: {
      status: "moderate",
      reported_at: "2026-07-24T08:45:00Z",
      report_count: 3,
      freshness: "fresh",
    },
    created_at: "2026-07-20T08:00:00Z",
    updated_at: "2026-07-24T08:45:00Z",
  },
  {
    id: "spot-2",
    name: "Toyama Learning Commons",
    campus: "Toyama",
    building: "Building 33",
    floor_or_location: "1F",
    description: "A lively space for small-group discussion and project work.",
    noise_level: "lively",
    has_outlets: false,
    has_nearby_restroom: true,
    has_private_room: true,
    food_allowed: true,
    latest_crowd: null,
    created_at: "2026-07-20T08:00:00Z",
    updated_at: "2026-07-23T08:45:00Z",
  },
];
const privateContribution = {
  ...publicSpots[0],
  id: "spot-private",
  name: PRIVATE_SPOT_NAME,
  latest_crowd: null,
  visibility: "private",
  moderation_status: "approved",
  added_by: E2E_USER.uid,
};

const pendingRequest = {
  id: "request-pending",
  sender: {
    ...OTHER_STUDENT,
    match_reason: null,
  },
  recipient: {
    uid: E2E_USER.uid,
    nickname: E2E_USER.nickname,
    school_id: "ug-pse-en",
    year: 2,
    courses: ["Microeconomics", "Statistics"],
    study_styles: ["quiet_study"],
    study_language: "english",
    public_bio: null,
    match_reason: null,
  },
  topic: "Microeconomics",
  message: "Would you like to review the next problem set together?",
  sender_contact_methods: ["waseda_email"],
  recipient_contact_methods: [],
  status: "pending",
  created_at: "2026-07-24T08:30:00Z",
  updated_at: "2026-07-24T08:30:00Z",
  accepted_at: null,
};

const acceptedRequest = {
  ...pendingRequest,
  id: "request-accepted",
  status: "accepted",
  recipient_contact_methods: ["waseda_email"],
  updated_at: "2026-07-24T08:40:00Z",
  accepted_at: "2026-07-24T08:40:00Z",
};

export type ApiMockOptions = {
  missingProfile?: boolean;
  requestConflict?: boolean;
};

export async function installApiMock(page: Page, options: ApiMockOptions = {}) {
  await page.route("**/__test-api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__test-api/, "");
    const method = request.method();
    const headers = {
      "access-control-allow-origin": "http://127.0.0.1:3100",
      "content-type": "application/json",
    };
    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          ...headers,
          "access-control-allow-headers": "Accept, Authorization, Content-Type",
          "access-control-allow-methods": "GET, POST, PUT, PATCH, OPTIONS",
        },
      });
      return;
    }
    if (!request.headers().authorization?.startsWith("Bearer ")) {
      await route.fulfill({
        status: 401,
        headers,
        json: { detail: "Missing test bearer token" },
      });
      return;
    }

    if (path === "/users/me" && method === "GET") {
      if (options.missingProfile) {
        await route.fulfill({
          status: 404,
          headers,
          json: { detail: "Profile not found" },
        });
      } else {
        await route.fulfill({ status: 200, headers, json: privateProfile });
      }
      return;
    }

    if (path === "/users/me" && method === "PUT") {
      const submitted = request.postDataJSON();
      await route.fulfill({
        status: 200,
        headers,
        json: {
          ...privateProfile,
          ...submitted,
          uid: E2E_USER.uid,
          created_at: privateProfile.created_at,
          updated_at: "2026-07-24T10:00:00Z",
        },
      });
      return;
    }

    if (path === "/buddies/search" && method === "GET") {
      await route.fulfill({
        status: 200,
        headers,
        json: { items: [OTHER_STUDENT], next_cursor: null },
      });
      return;
    }

    if (path === "/requests" && method === "GET") {
      const box = url.searchParams.get("box");
      const items =
        box === "connected"
          ? [acceptedRequest]
          : box === "incoming"
            ? [pendingRequest]
            : [];
      await route.fulfill({
        status: 200,
        headers,
        json: { items, next_cursor: null },
      });
      return;
    }

    if (path === "/requests" && method === "POST") {
      if (options.requestConflict) {
        await route.fulfill({
          status: 409,
          headers,
          json: { detail: "Duplicate pending request" },
        });
        return;
      }
      const submitted = request.postDataJSON();
      await route.fulfill({
        status: 201,
        headers,
        json: {
          ...pendingRequest,
          ...submitted,
          sender: pendingRequest.recipient,
          recipient: OTHER_STUDENT,
        },
      });
      return;
    }

    const transition = path.match(
      /^\/requests\/([^/]+)\/(accept|decline|cancel)$/,
    );
    if (transition && method === "POST") {
      await route.fulfill({
        status: 200,
        headers,
        json: {
          ...pendingRequest,
          id: transition[1],
          status:
            transition[2] === "accept"
              ? "accepted"
              : transition[2] === "decline"
                ? "declined"
                : "cancelled",
          updated_at: "2026-07-24T10:00:00Z",
          accepted_at:
            transition[2] === "accept" ? "2026-07-24T10:00:00Z" : null,
        },
      });
      return;
    }

    if (path === "/requests/request-accepted/connection" && method === "GET") {
      await route.fulfill({
        status: 200,
        headers,
        json: {
          request_id: "request-accepted",
          status: "accepted",
          contacts: [
            {
              owner_uid: OTHER_STUDENT.uid,
              owner_nickname: OTHER_STUDENT.nickname,
              method: "waseda_email",
              value: "aoi@fuji.waseda.jp",
            },
          ],
        },
      });
      return;
    }

    if (path === "/study-spots/" && method === "GET") {
      await route.fulfill({
        status: 200,
        headers,
        json: { items: publicSpots, next_cursor: null },
      });
      return;
    }

    if (path === "/study-spots/" && method === "POST") {
      const submitted = request.postDataJSON();
      await route.fulfill({
        status: 201,
        headers,
        json: {
          ...submitted,
          id: "spot-created",
          latest_crowd: null,
          moderation_status:
            submitted.visibility === "public" ? "pending" : "approved",
          added_by: E2E_USER.uid,
          created_at: "2026-07-24T10:00:00Z",
          updated_at: "2026-07-24T10:00:00Z",
        },
      });
      return;
    }

    if (path === "/study-spots/mine" && method === "GET") {
      await route.fulfill({
        status: 200,
        headers,
        json: { items: [privateContribution], next_cursor: null },
      });
      return;
    }

    const spotMatch = path.match(/^\/study-spots\/([^/]+)$/);
    if (spotMatch && method === "GET") {
      const spot = publicSpots.find(({ id }) => id === spotMatch[1]);
      await route.fulfill({
        status: spot ? 200 : 404,
        headers,
        json: spot ?? { detail: "Study spot not found" },
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers,
      json: { detail: `No E2E fixture for ${method} ${path}` },
    });
  });
}

export async function signIn(page: Page, options: { verified?: boolean } = {}) {
  await installFirebaseMock(page, options);
  await page.goto("/sign-in");
  await page.getByLabel("Waseda student email").fill(E2E_USER.email);
  await page.locator('input[type="password"]').fill(E2E_USER.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

export async function signInVerified(page: Page) {
  await installApiMock(page);
  await signIn(page, { verified: true });
  await expect(page).toHaveURL(/\/dashboard$/);
}
