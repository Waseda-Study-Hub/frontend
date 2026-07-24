# Backend contract

Source of truth: `Waseda-Study-Hub/backend` branch
`feat/secure-study-hub-contract`, commit
`f4836b5dac943415bfd2782cfcdd1d3aaf013655`, proposed in
[backend PR #3](https://github.com/Waseda-Study-Hub/backend/pull/3). Routes were
traced through the FastAPI router, Pydantic schema, repository, tests, and
checked-in `openapi.json`.

Except for `/health`, every route requires
`Authorization: Bearer <Firebase ID token>`. The backend returns 401 for a
missing or invalid token, 403 for an unverified or disallowed email, and 503
when token verification is unavailable. Pydantic request models forbid extra
fields.

## Endpoint matrix

| Feature               | Method and route                       | Request / query                                                                        | Success                                             | Relevant errors              | Frontend consumer          | Status                  |
| --------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------- | -------------------------- | ----------------------- |
| Health                | `GET /health`                          | None                                                                                   | `{status}`                                          | 500                          | Operations                 | Available               |
| Current profile       | `GET /users/me`                        | None                                                                                   | `PrivateProfile`                                    | 401, 403, 404, 503           | Dashboard, Profile         | Available               |
| Replace profile       | `PUT /users/me`                        | `ProfileWrite`                                                                         | `PrivateProfile`                                    | 401, 403, 422, 503           | Profile onboarding/edit    | Available               |
| Patch profile         | `PATCH /users/me`                      | `ProfileUpdate`                                                                        | `PrivateProfile`                                    | 401, 403, 404, 422, 503      | API-ready; UI uses PUT     | Available               |
| Buddy search          | `GET /buddies/search`                  | `q`, `school_id`, `year`, `study_style`, `study_language`, `course`, `cursor`, `limit` | `PublicProfilePage`                                 | 401, 403, 422, 503           | Buddy directory            | Available               |
| Buddy recommendations | `GET /buddies/recommend`               | `cursor`, `limit`                                                                      | `PublicProfilePage`                                 | 401, 403, 404, 422, 503      | Future ranked view         | Available, not consumed |
| Create request        | `POST /requests`                       | `StudyRequestCreate`                                                                   | `StudyRequestSummary` (201)                         | 401, 403, 404, 409, 422, 503 | Request composer           | Available               |
| List requests         | `GET /requests`                        | `box=incoming\|sent\|connected`, `cursor`, `limit`                                     | `StudyRequestPage`                                  | 401, 403, 422, 503           | Dashboard, Requests, badge | Available               |
| Accept request        | `POST /requests/{id}/accept`           | `StudyRequestAccept`                                                                   | `StudyRequestSummary`                               | 401, 403, 404, 409, 422, 503 | Requests                   | Available               |
| Decline request       | `POST /requests/{id}/decline`          | None                                                                                   | `StudyRequestSummary`                               | 401, 403, 404, 409, 503      | Requests                   | Available               |
| Cancel request        | `POST /requests/{id}/cancel`           | None                                                                                   | `StudyRequestSummary`                               | 401, 403, 404, 409, 503      | Requests                   | Available               |
| Authorized contacts   | `GET /requests/{id}/connection`        | None                                                                                   | `ConnectionContact`                                 | 401, 403, 404, 409, 503      | Connected requests         | Available               |
| Public spots          | `GET /study-spots/`                    | `q`, `campus`, `noise_level`, amenity flags, `crowdedness`, `cursor`, `limit`          | `StudySpotPage`                                     | 401, 403, 422, 503           | Dashboard, Spot directory  | Available               |
| Add spot              | `POST /study-spots/`                   | `StudySpotCreate`                                                                      | `StudySpotPrivate` (201)                            | 401, 403, 404, 422, 503      | Recommend form             | Available               |
| My contributions      | `GET /study-spots/mine`                | `cursor`, `limit`                                                                      | `StudySpotPrivatePage`                              | 401, 403, 422, 503           | Recommend form history     | Available               |
| Spot detail           | `GET /study-spots/{id}`                | None                                                                                   | `StudySpotPublic` or author-only `StudySpotPrivate` | 401, 403, 404, 503           | Spot detail                | Available               |
| Crowd report          | `POST /study-spots/{id}/crowd-reports` | `{status}`                                                                             | `CrowdReport` (201)                                 | 401, 403, 404, 422, 503      | Spot detail                | Available               |

## Core schemas

- `ProfileWrite`: nickname (1–50), optional private full name, year 1–8,
  stable school ID, up to three courses, study focus (up to 120), up to seven
  study styles, language, optional public bio, and private contacts.
- The backend currently treats `school_id` as an opaque stable identifier. The
  canonical 33-entry mapping lives once in `src/lib/constants/schools.ts`; IDs
  are unique across level/language variants and are sent unchanged.
- Study-style IDs are `quiet_study`, `active_discussion`, `morning_person`,
  `afternoon_person`, `evening_night`, `group_study`, and `one_on_one`.
- `PublicProfile` includes only UID, nickname, school ID, year, public courses,
  study styles, language, optional bio, and optional transparent match reason.
  It never includes full name or contacts.
- `StudyRequestCreate`: recipient UID, optional topic (up to 120), message
  (1–500), and one to four unique contact methods.
- `ConnectionContact` is available only after acceptance and contains only the
  methods each participant authorized.
- `StudySpotCreate` contains structured location, noise, amenities, and
  visibility. `added_by` and moderation state are server-controlled.
- The public spot page contains approved public spots only. Private, pending,
  and rejected records are not returned. An inaccessible spot detail is 404.
- Crowd reports contain status, server timestamp, and freshness; public
  responses contain no reporter identity.

## Browser contract

The client sends `Accept: application/json` on every request,
`Content-Type: application/json` only when a body exists, and a current
Firebase ID token. It supports cancellation, 204 responses, non-JSON failures,
FastAPI field errors, safe status mapping, and Zod response validation.

The backend CORS allowlist permits only configured exact origins, the
`GET/POST/PUT/PATCH/OPTIONS` methods, and the
`Authorization/Content-Type/Accept` headers. Credentials are disabled because
authentication uses bearer tokens rather than cookies.
