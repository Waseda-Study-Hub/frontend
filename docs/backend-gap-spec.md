# Backend production gap specification

## Authentication and authorization

Verify `Authorization: Bearer <Firebase ID token>` with Firebase Admin and return a typed principal (`uid`, verified email, `email_verified`). Reject missing/invalid tokens with 401 and unverified/non-allowed domains with 403. Never accept UID or `added_by` as authority from a body or path. Move credential path, project/database ID, origins, and allowed domains into validated settings. Add CORS with an explicit origin allowlist.

Use `/users/me` for profile mutation. Return a privacy-safe `PublicProfile` for discovery that excludes full name and all contact fields.

## Requests and contact sharing

Add `study_requests` with `id`, sender/recipient UIDs, optional course/topic, message (1-500), selected contact methods, status (`pending|accepted|declined|cancelled|expired`), timestamps, and version.

- `POST /requests`: derive sender from token; reject self-request; 409 duplicate pending pair.
- `GET /requests?box=incoming|sent|connected&cursor=&limit=`.
- `POST /requests/{id}/accept`, `/decline`, `/cancel`: enforce role and atomic state transition.
- `GET /requests/{id}/connection`: accepted participants only; return only contact methods authorized for that connection.

Use Firestore transactions/preconditions. Test token rejection, domain verification, cross-user denial, self/duplicate races, invalid transitions, participant-only reads, hidden contacts before acceptance, and selected-only contacts after acceptance.

## Study spots

Derive `added_by` from the principal. Add moderation policy, structured campus/building/floor, amenity booleans, noise level, timestamps, and cursor pagination. Add authenticated crowd reports with enum status and server timestamp. Do not expose reporter identity.

Set aligned limits, forbid extra fields, return stable errors, avoid raw exception strings, add write rate limiting, and fix the recommendations route so its intentional 404 is not converted to 500.
