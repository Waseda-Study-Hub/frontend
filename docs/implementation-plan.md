# Production implementation plan

## Evidence and decisions

`main` contained the product deck and README only. `gptReference` is a separate-history Vite/Figma export with hard-coded data, navigation-only forms, unused generated UI, generic Unsplash imagery, and Supabase/Hono scaffolding. It was inspected with `git show` and not merged.

The backend is a small FastAPI/Firestore service. Router, schema, and persistence paths were traced directly. It supports profile CRUD, major-only buddy search, same-major/course recommendations, and study-spot list/create. It does not authenticate, authorize, paginate, moderate, or implement requests/contact sharing/crowd reports.

The production frontend uses Next.js App Router, strict TypeScript, Firebase client authentication, a centralized typed API client, TanStack Query, and an original accessible design system. Unsupported features are explicitly unavailable rather than simulated.

## Delivery

- [x] Preserve the deck and inspect references.
- [x] Establish framework, API, auth, validation, and test foundations.
- [x] Create the canonical 33-entry school catalogue and responsive selector.
- [x] Implement auth, shell, dashboard, profile, buddies, requests status, spots, contribution, privacy, 404, and error states.
- [x] Integrate every backend operation used by those screens.
- [x] Document backend security and feature gaps.
- [ ] Deploy only after backend authentication and authorization are implemented.

Reusable ideas from `gptReference`: warm off-white background, restrained rose/blue accent, rounded cards, concise positioning, and school search. Replaced: Vite routing, fake submits, hard-coded data, native multi-select, stock photos, fake requests, generated component inventory, and Supabase scaffolding.
