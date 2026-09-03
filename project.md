# Snap — Frontend Sprint (Thu 3/9 → Mon 7/9)

Build the whole Expo frontend against a **mocked** API. On Wed 9/9 we swap a single file
(`snap/lib/api.ts`) from the mock to the real backend and everything should keep working.

- **Tue 8/9 (half day):** backend together — S3 upload, `getSnap`, expiry.
- **Wed 9/9:** backend together — WebSockets, incoming friend requests, everyone switches to the real backend.
- Backend does **not** need to run this week.

## The three rules

1. **Never change the API contract.** No field names, no status codes, no URLs. If something looks wrong, tell Ahmad — don't just change it.
2. **All backend calls go through `snap/lib/api.ts`.** No `fetch` outside `lib/`. That is the only file swapped on Wednesday.
3. **We drive the AI.** Decide states/calls/errors as a group → write pseudocode → give the AI one function at a time → read every line and delete anything we can't explain. Everyone must be able to explain every file on Wednesday.

Also: leave `snap/AGENTS.md` in place, and decide new packages as a group (check they ship in Expo Go at `docs.expo.dev/versions/v54.0.0/sdk/<package>/`).

## Who does what

| Part | Owner | Scope |
| --- | --- | --- |
| **A** | **me (Devinder)** | `lib/api.ts` mock, auth context shape, Camera + PhotoPreview into navigation, error sweep + centralized 401 → logout |
| B | teammate | Navigation skeleton + auth gate, auth context implementation, Register / Login |
| C | teammate | ConversationsPage (friend list), AddFriendView |
| D | teammate | MapsPage, recipient picker + `sendSnap` |

### Agree on this Thursday, before anyone writes a screen

Four of us editing `app/` in parallel with no agreed filenames means merge conflicts and
duplicate screens. The route tree is fixed up front:

```
app/_layout.tsx            root stack + AuthProvider
app/(auth)/_layout.tsx
app/(auth)/login.tsx       B
app/(auth)/register.tsx    B
app/(tabs)/_layout.tsx     B
app/(tabs)/index.tsx       camera (A moves the current app/index.tsx here)
app/(tabs)/conversations.tsx   C
app/(tabs)/map.tsx         D
app/add-friend.tsx         C
app/send-snap.tsx          D — recipient picker, opened from the photo preview
lib/auth-context.tsx       shape by A, implementation by B
```

Everything that isn't a screen stays out of `app/` — `components/`, `lib/`.

## Part A — my tasks

### A1 · `lib/api.ts` mock (Thu 3/9)

Types, `ApiError`, `setAccessToken`, and the six functions. Structure:

| File | Contents |
| --- | --- |
| `snap/lib/api.ts` | `export * from './api.mock'` → becomes `'./api.real'` on Wednesday |
| `snap/lib/api.types.ts` | the types + `ApiError` |
| `snap/lib/api.mock.ts` | the mock |
| `snap/lib/api.real.ts` | real `fetch`, may stay empty until Wednesday |

Binding exports — exactly these signatures:

```ts
export class ApiError extends Error {
  constructor(public code: number, message: string) { super(message) }
}

export function setAccessToken(token: string | null): void

export async function register(username: string, password: string): Promise<AuthResponse>
export async function login(username: string, password: string): Promise<AuthResponse>
export async function getFriends(): Promise<ApiFriend[]>
export async function addFriend(friendUsername: string): Promise<AddFriendResponse>
export async function deleteFriend(username: string): Promise<void>
export async function sendSnap(input: {
  recipients: string[]
  photo: { uri: string; mimetype: string }
  text?: string
}): Promise<void>
```

The mock must:

- delay 300–800 ms so loading states are visible
- keep state in memory — `addFriend` changes what `getFriends` returns
- seed data with both `mutual: true` and `mutual: false`
- throw the real backend messages (table below)

The mock also has to **remember who is logged in**: `login`/`register` store the username, and
`addFriend` compares against it for the 400 `You can't add yourself as a friend`, while `sendSnap`
reads the in-memory friend list for the 400 `You are not friends with …`. The real backend gets
this from the JWT; the mock has to keep it itself.

**Done when:** every function returns both a successful response and its mocked errors.

### A1b · Auth context shape (Thu 3/9, with A1)

A3 says `logout()` lives in exactly one place — but B needs that same place on Thursday for the
auth gate and on Friday for storing tokens. So the shape gets decided on day one, not on Monday:

```ts
type AuthState = {
  user: ApiUser | null
  isLoading: boolean          // true while reading SecureStore on startup
  login(username, password): Promise<void>   // calls api.login + setAccessToken + SecureStore
  register(username, password): Promise<void>
  logout(): Promise<void>     // setAccessToken(null) + clear SecureStore + router.replace login
}
```

I define the file and the types, B fills in the implementation and the gate. Screens never touch
SecureStore or `setAccessToken` directly — they call the context.

**Done when:** B can build the auth gate without inventing his own token storage.

### A2 · Camera + PhotoPreview (Sat 5/9)

`app/index.tsx` already holds a working `CameraView` (double-tap flips the camera) and renders
`components/PhotoPreview.tsx` once a photo is taken. Move it into the navigation structure B builds,
instead of it being the root route.

**Done when:** taking a new photo after discarding one works.

### A3 · Error sweep + centralized 401 (Mon 7/9)

Every mock error reproduced on every screen. `401` must clear the token
(`setAccessToken(null)`), clear SecureStore, and route to login — from **one** place
(auth context with `logout()`), not from every `catch` block.

**Done when:** the checklist below is fully ticked and `logout()` lives in a single file.

## API contract (binding)

Protected endpoints need `Authorization: Bearer <access_token>`. Base URL comes on Wednesday
(`localhost` only works in the simulator — a physical phone needs the computer's IP).

| Method | URL | Body | Response |
| --- | --- | --- | --- |
| POST | `/register` | `{ username, password }` | 201 `{ tokens, user }` |
| POST | `/login` | `{ username, password }` | 200 `{ tokens, user }` |
| GET | `/friends` | – | 200 `{ friends: ApiFriend[] }` |
| POST | `/friends` | `{ friend_username }` | 200 `{ status }` |
| DELETE | `/friends/:username` | – | 204 (empty body) |
| POST | `/snaps` | `multipart/form-data` | 201 |

`POST /snaps` fields: `file` (jpeg/png, max 10 MB), `recipients` (array of usernames), `text` (optional caption).

```ts
type ApiUser = { username: string; created_at: string } // ISO string
type AuthResponse = {
  tokens: { access_token: string; refresh_token: string }
  user: ApiUser
}
type ApiFriend = { username: string; created_at: string; mutual: boolean }
type AddFriendResponse = { status: 'pending' | 'friends' }
```

Errors always look the same. `message` is written for the user — show it, don't invent our own.

```json
{ "success": false, "code": 400, "message": "You are not friends with moises" }
```

Handle 400 (bad input), 401 (missing/invalid token), 404, 409 (already exists), 500.

In the real implementation: `API_BASE_URL` at the top, anything not 2xx →
`throw new ApiError(body.code, body.message)`, or `new ApiError(status, 'Något gick fel')` if the
body isn't JSON.

### Friendship model

A friendship is two directed links. A adds B → the link A → B exists. When B also adds A they are friends.

| Situation | `mutual` | In `/friends`? |
| --- | --- | --- |
| We added them, they haven't answered | `false` | Yes |
| Both added each other | `true` | Yes |
| They added us, we haven't answered | – | No — built together on Wednesday |

`POST /friends` answers `pending` or `friends` — show it directly, don't refetch the list.
`DELETE /friends/:username` only removes our own link and always returns 204.

### Mock error table

| Triggered by | Response |
| --- | --- |
| Protected call without token | 401 `You are not authorized` |
| `register('taken', …)` | 409 `User already exists` |
| `login('nobody', …)` | 404 `User not found` |
| `login(…, 'wrong')` | 401 `Invalid password!` |
| `addFriend(<own name>)` | 400 `You can't add yourself as a friend` |
| `addFriend('nobody')` | 404 `User not found` |
| `addFriend('anna')` | `status: 'friends'` |
| `addFriend(<any other name>)` | `status: 'pending'` |
| `sendSnap` to someone with `mutual: false` | 400 `You are not friends with kalle` |
| `register('boom', …)` | 500 `Unknown error` |

## Priority order (whole group, top to bottom)

An item is done when it works against the mock, errors included.

1. `lib/api.ts` with mock: types, `ApiError`, `setAccessToken`, the six functions — **A**
2. Navigation skeleton + auth gate: all screens exist (empty is fine), no token → login — **B**
3. Register / Login: validation, tokens in `expo-secure-store`, auto-login on restart — **B**
4. ConversationsPage: friend list from `getFriends`, `mutual` true/false look different, refetch on return — **C**
5. AddFriendView: add friend, show `pending` / `friends` from the response — **C**
6. CameraPage + PhotoPreview: move `app/index.tsx` into the navigation — **A**
7. Recipient picker + send: multi-select, `mutual: true` only, caption, `sendSnap` — **D**
8. MapsPage: map, own position, friend markers — **D**
9. Error sweep: every mock error on every screen, 401 → logout → login — **A**

Pace: 1–3 Thursday, 4–7 Friday–Saturday, 8–9 Sunday, Monday buffer.

### MapsPage

There is no endpoint for positions and none is coming — MapsPage is layout and permissions, not data.
Full-screen map centered on own position, permission request with a message and "try again" on denial,
a marker for ourselves plus fake friend markers from `lib/mockLocations.ts` (**not** `lib/api.ts`).
`bunx expo install react-native-maps expo-location` — both are in Expo Go, no API key. Don't use
`expo-maps` (alpha, needs a dev build). Test on a phone, not the web.

### Don't build this week

WebSocket client, S3 upload logic, push notifications, viewing received snaps.
If we're ahead: UI space for incoming requests (no logic), ChatView skeleton, animations, dark mode.

### Backend points — only when 1–9 are done and pushed

Don't touch existing endpoints; propose new ones in the group chat first.

10. Get the backend running locally: `docker compose up -d`, `.env`, `bunx dbmate up`, test `/register` and `/login`.
11. Finish `POST /snaps`: answer 201, read `recipients` and `text` from the multipart fields (`services.sendSnap` DB part exists).
12. `GET /snaps/:id`: a snap you're a recipient of, respond with a presigned URL (`getPresignedUrl` exists). Propose the response format first.
13. Expiry: snaps past `expires_at` can't be fetched and get deleted (row + S3 object).
14. Incoming friend requests: new endpoint, don't change `GET /friends`.
15. WebSockets for text messages (`@fastify/websocket`) — Wednesday's topic.

## Questions for Ahmad — found by reading the backend

Rule 1 says raise contract problems instead of working around them. These three all affect
Wednesday's swap, so they go in the group chat before Tuesday.

**1. Access tokens live 60 seconds and there is no refresh endpoint.**
`generateFreshTokens` in `backend/src/http/controllers.ts` signs the access token with
`expiresIn: "60s"`; the refresh token lasts 10 years but no route consumes it and `/refresh`
isn't in the contract. A correct centralized `401 → logout` therefore throws the user back to
login one minute after they sign in. Does he want a refresh endpoint on Tuesday, or a longer
expiry? We don't work around it on our side.

**2. 401 from protected routes isn't the error envelope.**
The guard in `backend/src/auth.ts` does `reply.status(401).send('Not authorized')` — plain text,
not `{ success, code, message }`. Our non-JSON fallback (`new ApiError(status, 'Något gick fel')`)
handles it without crashing, but the message the user sees on Wednesday won't be the mock's
`You are not authorized`. Everything thrown through the error handler (`Invalid password!` etc.)
is fine — it's only the auth guard.

**3. How is `recipients` encoded in the multipart body?**
`controllers.sendSnap` reads `req.body.recipients`, and backend point 11 is where that gets
finished — but the frontend has to pick the encoding *now* so the two match. Proposal: append
`recipients` once per username to the `FormData`. Needs confirming with whoever takes point 11.

## Current state of the repo

- `snap/app/index.tsx` — camera screen (root route today, moves in A2)
- `snap/app/_layout.tsx` — stack layout
- `snap/components/PhotoPreview.tsx` — preview + discard
- `snap/lib/` — **does not exist yet**, A1 creates it
- Expo SDK 54, expo-router 6, expo-camera 17, bun
- `plan.md` in the repo root is the original brainstorm sketch — superseded by this file.
- `snap/` still has the Expo starter template files (`hello-wave.tsx`, `parallax-scroll-view.tsx`,
  `ui/collapsible.tsx`, `themed-*.tsx`, `haptic-tab.tsx`, `hooks/`, `constants/theme.ts`,
  `scripts/reset-project.js`). Nothing under `app/` imports any of them — they only reference each
  other. Since the bar is "everyone can explain every file", they get deleted once the navigation
  skeleton exists and we know for certain nothing needs them.

## Commands

```bash
docker compose up -d          # only needed for the backend points
cd snap && bun install
bunx expo start
bunx expo lint                # run before calling anything done
bunx tsc --noEmit
```

Packages to add, with `expo install` so the SDK 54 versions get resolved:

```bash
bunx expo install expo-secure-store                    # A1b / B — token storage
bunx expo install react-native-maps expo-location      # D — MapsPage
```

`expo-location` needs its config plugin in `app.json` next to the `expo-camera` one, otherwise the
permission prompt has no explanation string:

```json
["expo-location", { "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to show you on the map" }]
```

## Checklist before Tuesday

- [ ] `lib/api.ts` exports the exact signatures, `ApiError` and `setAccessToken`
- [ ] No `fetch` outside `lib/`
- [ ] Register/login against the mock, tokens persist, app opens logged in after restart
- [ ] Friend list shows `mutual: true` and `false` differently
- [ ] Add friend shows `pending` / `friends`
- [ ] Camera → preview → recipient picker (`mutual: true` only) → send
- [ ] MapsPage shows the map with our own position
- [ ] 401 and 409 don't crash the app; 401 routes to login
- [ ] Everyone can explain every file
- [ ] Pushed to the group repo

If we won't make it: still show up, but post in the group chat before Monday night what's missing and
which backend points (if any) we got to. Stuck → group chat, not DMs.

## Presenting on Wednesday

Ahmad asks whether we can explain every file. One sentence each, written as we go — if a file
can't get a sentence, it shouldn't be in the repo.

| File | What I say about it |
| --- | --- |
| `lib/api.types.ts` | The contract as types, plus `ApiError` carrying the HTTP code and the backend's own message. |
| `lib/api.mock.ts` | In-memory friends + current user, 300–800 ms delay, throws the same `ApiError`s the real backend does. |
| `lib/api.ts` | One line. It re-exports the mock today and the real client on Wednesday — that's the whole swap. |
| `lib/api.real.ts` | `fetch` with the bearer token, unwraps `{ friends }`, turns any non-2xx into an `ApiError`. |
| `lib/auth-context.tsx` | Where the token lives. `logout()` exists once here, so a 401 anywhere ends in the same place. |
| `app/(tabs)/index.tsx` | Camera; double-tap flips it, a photo hands off to the preview. |
| `components/PhotoPreview.tsx` | Shows the photo, discard returns to the camera, send goes to the recipient picker. |

Demo order, so the run-through is short: register → restart the app to show auto-login → friend
list with a `mutual` true and a false → add `anna` (`friends`) and someone else (`pending`) →
camera → preview → pick recipients → send → map → then the errors: `login('nobody')`,
`register('taken')`, `register('boom')`, add yourself, and a 401 dropping back to login.

## Working agreement

- Work happens on the local `part-a` branch, pushed to `main` when a part is finished.
- **This file gets updated after each finished part** — tick the checklist, note what changed and anything the others need to know.
