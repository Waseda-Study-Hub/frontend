# Backend contract

Source: `Waseda-Study-Hub/backend` `main`, traced from router through Pydantic model and Firestore call. There is no checked-in OpenAPI artifact; FastAPI generates `/openapi.json` at runtime after Firebase Admin initialization.

| Feature                  | Method | Route                      | Auth | Request          | Success             | Errors                                 | Frontend          | Status                            |
| ------------------------ | ------ | -------------------------- | ---- | ---------------- | ------------------- | -------------------------------------- | ----------------- | --------------------------------- |
| Replace profile          | POST   | `/users/{uid}`             | None | `UserProfile`    | `{status, uid}`     | 422, 500                               | Profile           | Partial; caller controls UID      |
| Read profile             | GET    | `/users/{uid}`             | None | -                | profile object      | 404                                    | Dashboard/profile | Partial; no privacy/auth          |
| Patch profile            | PATCH  | `/users/{uid}`             | None | arbitrary object | `{status, uid}`     | 500                                    | Not used          | Partial; unsafe                   |
| Delete profile           | DELETE | `/users/{uid}`             | None | -                | `{status, uid}`     | 404, 500                               | Not exposed       | Partial; unsafe                   |
| Buddy search             | GET    | `/buddies/search?major=`   | None | exact major      | profiles with `uid` | 422, 500                               | Buddy directory   | Partial; no pagination/projection |
| Recommendations          | GET    | `/buddies/recommend/{uid}` | None | -                | profiles + reason   | intended 404, currently wrapped as 500 | Future dashboard  | Partial; leaks fields             |
| List spots               | GET    | `/study-spots/`            | None | -                | spots with `id`     | 500                                    | Spot directory    | Available; unpaginated            |
| Add spot                 | POST   | `/study-spots/`            | None | `StudySpot`      | `{id}`              | 422, 500                               | Recommend form    | Partial; caller controls author   |
| Requests/contact sharing | -      | -                          | -    | -                | -                   | -                                      | Requests          | Missing                           |
| Crowd reports            | -      | -                          | -    | -                | -                   | -                                      | Spots/dashboard   | Missing                           |

`UserProfile`: `username`, `full_name`, `year`, `major`, `courses[]`, `availability_slots[]`, optional `bio`, optional `instagram_tag`.

`StudySpot`: `name`, `location`, `description`, `labels[]`, `added_by`, `is_public`.

The frontend sends `Authorization: Bearer <Firebase ID token>` when signed in for forward compatibility, but the backend ignores it. Production remains blocked until the gap specification is implemented.
