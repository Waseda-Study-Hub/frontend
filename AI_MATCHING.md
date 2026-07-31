# AI Study Match

## Product goal

AI Study Match lets a student describe a suitable study partner in natural
language. Gemini converts that sentence into structured search criteria.
Application code then ranks real profiles returned by the existing FastAPI
backend.

The model interprets intent; it does not select or invent students.

## Request flow

1. A signed-in student enters a sentence on the Study Buddies screen.
2. The browser sends the sentence and the student's Firebase ID token to
   `POST /api/ai-match`.
3. The Next.js route verifies the token through Firebase Authentication and
   confirms that the email is verified and belongs to an allowed Waseda domain.
4. The route sends only the search sentence to Gemini.
5. Gemini returns JSON constrained by a schema: years, courses, majors,
   availability, preferences, and a short summary.
6. The route validates and normalizes every field before returning it.
7. Deterministic TypeScript code scores the real buddy records already loaded
   from FastAPI. Course, major, year, availability, and preference matches have
   explicit weights.
8. The interface shows the interpreted criteria and explains why each profile
   matched.

## Privacy and security decisions

- `GEMINI_API_KEY` is read only inside a server route. It is never included in
  browser JavaScript or the public runtime-config endpoint.
- The route rejects callers who are not signed in with a verified Waseda
  account.
- The Gemini request uses `store: false`.
- Buddy names, bios, contact details, and messages are never sent to Gemini.
- Input is limited to 400 characters, model output is constrained by JSON
  Schema, and all returned values are validated again in application code.
- The API call has a timeout and returns controlled errors for missing
  configuration, rate limits, and provider failures.

## Reliability strategy

This is a hybrid LLM system:

- Gemini handles the ambiguous task: understanding natural language.
- Deterministic code handles the sensitive task: ranking real users.
- A schema prevents free-form output from entering the ranking pipeline.
- If no structured field matches, the original backend recommendations remain
  visible instead of presenting a hallucinated result.

`tests/ai-match.test.ts` checks normalization, weighted ranking, explanations,
and the no-match fallback. `evals/ai-match-cases.json` contains representative
queries for manually checking extraction quality whenever the prompt or model
changes.

## Deployment

Create a fresh Gemini API key after revoking any exposed key. Add these
variables in Vercel and redeploy:

```text
GEMINI_API_KEY=<secret replacement key>
GEMINI_MODEL=gemini-3.6-flash
```

Do not prefix the secret with `NEXT_PUBLIC_` and do not commit it to Git.

## Short interview explanation

> I built a privacy-conscious hybrid recommendation system. Gemini translates a
> student's natural-language request into a validated schema, while deterministic
> TypeScript ranks only real profiles from our backend. The server verifies the
> existing Firebase identity, sends no profile data to the model, disables
> interaction storage, and keeps the provider key in Vercel. I also added
> regression tests and prompt-evaluation cases so model or prompt changes can be
> checked systematically.

