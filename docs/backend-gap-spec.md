# Backend rollout gaps

The original unauthenticated backend gaps are resolved on
`feat/secure-study-hub-contract`. That branch adds verified Firebase bearer
authentication, exact email-domain enforcement, `/users/me`, public/private
response models, study requests, authorized contact sharing, moderated/private
spots, anonymous crowd reports, validated CORS, tests, and a checked-in OpenAPI
artifact.

No core frontend action uses the legacy unauthenticated routes or fabricates a
successful write.

## Required before deployment

1. Merge and deploy the backend pull request before the frontend pull request.
2. Configure a real Firebase project and backend Application Default
   Credentials or `FIREBASE_CREDENTIALS_PATH`.
3. Configure production `CORS_ORIGINS`, `ALLOWED_EMAIL_DOMAINS`,
   `FIREBASE_PROJECT_ID`, and `FIRESTORE_DATABASE_ID`.
4. Apply the Firestore migration and index guidance in the backend
   `docs/firestore-schema.md`.
5. Run an authorized cloud-backed smoke test for sign-up, email verification,
   profile save, request acceptance/contact reveal, private-spot isolation, and
   public contribution moderation.

These checks require credentials and production origins that are intentionally
not stored in either repository.

## Remaining product and operations work

- Public spot contributions start as `pending`. Approval is currently an
  operational Firestore action; no moderator role, audit log, or moderation UI
  has been defined.
- The MVP renders author-only contribution history and returned moderation
  states. It does not expose moderation controls because no moderator role has
  been defined.
- Application-level write throttling is not implemented. The frontend handles
  429 safely, but production should add gateway or application rate limits
  before a broad launch.
- Image upload, favorites, maps, messaging, push notifications, and advanced
  matching remain intentionally out of scope.

None of these items permits private data to enter a public response. They are
release-operations or post-MVP capabilities, not fake frontend success paths.
