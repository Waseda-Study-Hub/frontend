# Production implementation plan

## Re-audit evidence

Frontend `main` contained the project deck and documentation. The draft PR
introduced the Next.js application. `gptReference` is a separate-history
Vite/Figma export with hard-coded data, navigation-only forms, generic stock
imagery, generated component inventory, and obsolete Supabase/Hono
scaffolding. It was inspected with Git read-only commands and never merged.

The backend `main` branch was re-read from routes through models and Firestore
calls. It was unauthenticated and did not support the required request,
privacy, moderation, or browser CORS contract. The coordinated backend feature
branch now supplies those capabilities without changing its default branch.

## Internal screen and interaction checklist

| Area                        | Re-audit state                                          | Completed state                                                                                                                              |
| --------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign in / sign up / reset   | Unsafe when Firebase was absent; no verification screen | Fail-closed configuration state, verified-email routing, resend cooldown, forced token refresh, inline errors                                |
| Protected application shell | Private UI could render before trustworthy auth         | Verified user gate, UID-scoped query keys, cache clearing before sign-out, active desktop/mobile navigation                                  |
| Dashboard                   | Metric-oriented and incomplete                          | Personalized hero, onboarding, request/connection summaries, courses, two real spot previews, honest freshness and error states              |
| Academic profile            | Partial                                                 | Validated onboarding/edit form, private full name and contacts, three-course cap, seven styles, language, unsaved warning                    |
| School selector             | Functional but incomplete keyboard/mobile behavior      | Canonical 33 schools, search, level/language filters, result count, listbox semantics, roving keyboard focus, native modal focus containment |
| Buddy directory             | Partial filters and untrusted response boundary         | Public-profile Zod boundary, self-excluding API, URL-synced filters, pagination control, pending-request state, error/empty/loading states   |
| Request composer            | Missing persistence and privacy guarantees              | Persisted modal, validation, contact choices, conflict/success states, native modal focus containment                                        |
| Requests center             | Missing                                                 | Incoming/sent/connected views, accept/decline/cancel, contact reveal only through accepted connection endpoint                               |
| Study spots                 | Legacy unstructured records and unsafe privacy          | Approved-public API, structured filters/cards/details, neutral placeholders, crowd freshness and reporting                                   |
| Recommend a spot            | Caller-controlled authority                             | Structured validated form, server-derived author, public/private visibility, returned moderation status, honest success                      |
| Supporting states           | Partial                                                 | Privacy explanation, forbidden, not-found, global error, loading, empty, retry, and mobile-safe states                                       |
| CI and browser checks       | Missing                                                 | Node 20 workflow, formatting/lint/types/unit/build gate, Playwright production-mode browser gate, four responsive widths, axe checks         |

## Architecture decisions

- Next.js App Router and strict TypeScript provide one routing/build
  architecture at the repository root.
- Firebase Web SDK handles client authentication only. FastAPI owns application
  data and every authorization decision.
- TanStack Query handles cancellable server state; every private query key
  includes the authenticated UID.
- React Hook Form and Zod align form limits and validate important API
  responses at runtime.
- The browser has no Firestore access and no runtime mock-data mode.
- The warm off-white, restrained rose/blue, rounded-card visual direction is
  retained without copying the deck or implying official university status.

## Delivery sequence

- [x] Preserve the deck and inspect `main`, `gptReference`, screenshots, and
      backend sources.
- [x] Establish routing, design tokens, authentication, API, forms, query
      state, and tests.
- [x] Implement the canonical school selector and all core product flows.
- [x] Add the secure backend contract on a separate branch with tests and
      OpenAPI drift checking.
- [x] Add frontend CI and production-mode Playwright coverage.
- [ ] Merge and deploy the backend first, configure authorized cloud
      credentials/origins, and run the final live smoke test.
- [ ] Merge or deploy the frontend only after that smoke test and both PRs’
      checks pass.
