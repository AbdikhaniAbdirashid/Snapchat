# Snap — Frontend Sprint (Thu 3/9 → Mon 7/9)

**This is the group's shared file. Everyone reads it, everyone updates it.**
If you change a decision, change it here first and say so in the group chat.

Backend already has auth, friends, and the start of snaps. The frontend has almost nothing. On
Tue 8/9 and Wed 9/9 we do the hard backend work together (S3, WebSockets), and that only works if
the frontend already exists. So this week we build the whole app against a **mock API**, and on
Wednesday we swap one file — `snap/lib/api.ts` — and everything keeps working against the real
backend.

The backend does **not** need to run this week.

## Update — 7 September 2026 — Part B

- Navigation: completed
- Login screen: completed
- Registration screen: completed
- Auth gate: completed
- Testing on a physical phone: remaining
- Commit and push: remaining

## The three rules

1. **Never change the API contract.** No field names, no status codes, no URLs. If something looks
   wrong, tell Ahmad — don't just change it. (We have three of these already; see
   [Questions for Ahmad](#questions-for-ahmad).)
2. **All backend calls go through `snap/lib/api.ts`.** No `fetch` anywhere outside `snap/lib/`.
   That is the only file we swap on Wednesday.
3. **We drive the AI.** Decide states/calls/errors → write pseudocode → give the AI one function at
   a time → read every line and delete anything you can't explain. **Ahmad asks each of us to
   explain any file on Wednesday.**

Leave `snap/AGENTS.md` in place. New packages are a group decision — check they ship in Expo Go at
`docs.expo.dev/versions/v54.0.0/sdk/<package>/` first.

## Who is who

Fill in your name next to your letter so the rest of the file makes sense.

| Letter | Name | GitHub |
| --- | --- | --- |
| **A** | Devinder | `devinder-dev` |
| **B** | _(fill in)_ | |
| **C** | _(fill in)_ | |
| **D** | _(fill in)_ | |

## Setup — everyone does this first

```bash
git clone https://github.com/AbdikhaniAbdirashid/Snapchat.git
cd Snapchat/snap
bun install
bunx expo start          # scan the QR code with Expo Go on your phone
```

Packages we've agreed to add. Use `expo install`, never `bun add`, so the SDK 54 versions get
resolved:

```bash
bunx expo install expo-secure-store                    # A/B — token storage
bunx expo install react-native-maps expo-location      # D — MapsPage
```

`expo-location` also needs its config plugin in `snap/app.json`, next to the `expo-camera` one:

```json
["expo-location", { "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to show you on the map" }]
```

Before you call anything done, from `snap/`:

```bash
bunx expo lint
bunx tsc --noEmit
```

Test on a **phone**, not the web — the camera and the map don't work properly in a browser.

## How we work together

- Branch per part: `part-a`, `part-b`, `part-c`, `part-d`. Never commit straight to `main`.
- Push your branch, then merge into `main` when a task is finished and works against the mock.
  Pull `main` before you start each session.
- **Only touch your own files.** If you need something in someone else's file, ask in the group
  chat — don't edit it. The route tree below exists so this doesn't happen by accident.
- Tick your boxes in [Checklist before Tuesday](#checklist-before-tuesday) as you go, and update
  this file when a decision changes.
- Stuck for more than ~30 minutes? Group chat, not DMs.

## Route tree — agreed, don't rename

Four people editing `app/` in parallel with no agreed filenames means merge conflicts and duplicate
screens. These filenames are fixed:

```
app/_layout.tsx                 root stack + AuthProvider          B
app/(auth)/_layout.tsx                                             B
app/(auth)/login.tsx                                               B
app/(auth)/register.tsx                                            B
app/(tabs)/_layout.tsx          tab bar                            B
app/(tabs)/index.tsx            camera                             A
app/(tabs)/conversations.tsx    friend list                        C
app/(tabs)/map.tsx              MapsPage                           D
app/add-friend.tsx                                                 C
app/send-snap.tsx               recipient picker + caption         D

components/PhotoPreview.tsx     preview + discard + send           A
lib/api.ts                      re-exports the mock                A
lib/api.types.ts                types + ApiError                   A
lib/api.mock.ts                 the mock                           A
lib/api.real.ts                 real fetch, empty until Wednesday  A
lib/auth-context.tsx            AuthProvider + useAuth()            A (done)
lib/mockLocations.ts            fake friend positions              D
```

Anything that isn't a screen stays **out of** `app/` — put it in `components/` or `lib/`.

## The work, per person

Each task is done when it works against the mock **including its errors**. Every screen needs a
loading state, an error state showing `error.message` from the `ApiError`, and an empty state where
it makes sense.

### A — API mock, auth context shape, camera, error sweep

**A1 · `lib/` and the mock — Thursday.** Everyone else is blocked on this, so it lands first.
Create `api.types.ts` (the contract types + `ApiError`), `api.mock.ts`, `api.ts` containing only
`export * from './api.mock'`, and an empty `api.real.ts`. The mock delays 300–800 ms so loading
states are visible, keeps friends in memory so `addFriend` changes what `getFriends` returns, seeds
both a `mutual: true` and a `mutual: false` friend, and throws every error in the
[mock error table](#mock-error-table). It also has to **remember who logged in**, because the
self-add 400 and the not-friends 400 both depend on it.
*Done when:* every function can be made to return both a success and its errors.

**A2 · Auth context — Thursday, right after A1. Done.** `lib/auth-context.tsx` exports
`AuthProvider` and `useAuth()`:

```ts
type AuthState = {
  user: ApiUser | null
  isLoading: boolean                          // true while reading SecureStore at startup
  login(username, password): Promise<void>    // api.login + setAccessToken + SecureStore
  register(username, password): Promise<void> // api.register + same session start as login
  logout(): Promise<void>                     // setAccessToken(null) + clear SecureStore + user = null
}
```

It ended up small enough to finish in one go rather than leaving a skeleton for B, so B's part is
the gate, not the implementation. Four things to know when using it:

- **`register()` logs you in.** `POST /register` answers 201 with the same `{ tokens, user }` as
  login, so the context starts the session straight away and the gate lands on the tabs. The
  register screen doesn't need to navigate anywhere. (Decision fixed 7/9 — earlier versions of this
  file said the opposite; the demo order below was always right.)
- **`logout()` does not navigate.** It sets `user` to `null` and the gate redirects. One mechanism,
  one place — the context deliberately doesn't know about `expo-router`.
- **Errors are not caught.** `login()` and `register()` let the `ApiError` through so the screen can
  show `e.message`.
- SecureStore holds two keys, `access_token` and `user`. There's no `GET /me`, so the user object
  has to be stored or we'd know we're logged in after a restart but not who as.

*Done when:* B can build the auth gate without inventing his own token storage.

**A3 · Camera into the navigation — Saturday. Done.** The working `CameraView` in `app/index.tsx`
(double-tap flips the camera) moves to `app/(tabs)/index.tsx`. `components/PhotoPreview.tsx` gets a
send button that routes to `app/send-snap.tsx` with the photo URI. Tapping Send hands the photo off:
when the camera tab gets focus back, the preview is cleared and the camera is ready for the next
photo. So D's `send-snap.tsx` only has to `router.back()` when it's done — success or cancel, the
camera handles itself.
*Done when:* taking a new photo after discarding one still works.

**A4 · Error sweep + centralized 401 — Monday. Done.** Protected 401s call
`notifyUnauthorized()` in the mock; `AuthProvider` plugs that into `logout()`. Screens do not
check `e.code === 401`. Login's `Invalid password!` 401 is not a protected call, so it stays on
login and shows the message.
*Done when:* the whole checklist is ticked and `logout()` appears in one file only.

### B — Navigation, auth gate, login and register

**B1 · Navigation skeleton — Thursday.** Create every file in the route tree above. Empty screens
with just the screen name as text are fine — the point is that C and D can start in parallel.
Tabs: camera, conversations, map.
*Done when:* you can reach every screen by tapping around.

**B2 · Auth gate — Thursday.** Root layout wraps everything in `AuthProvider` (A2's file). While
`isLoading`, show a splash/spinner. No user → redirect to `(auth)/login`. User → the tabs.
*Done when:* launching the app with no token always lands on login.

**B3 · Wire the context up — Friday.** The context itself is finished (A2), so this is using it
rather than writing it: `const { user, isLoading, login, logout } = useAuth()`. Screens never touch
SecureStore or `setAccessToken` — they only call these.
*Done when:* you log in, force-quit the app, reopen it, and you're still logged in.

**B4 · Login screen — Friday.** State: `username`, `password`, `loading`, `error`. Empty fields →
`"Fyll i båda fälten"`, don't call the API. Otherwise `loading = true`, call `login`, and on failure
set `error` to `e instanceof ApiError ? e.message : "Något gick fel"`. Button disabled while
loading. Link to register.
*Done when:* `login('nobody', …)` shows the 404 text and `login(…, 'wrong')` shows the 401 text.

**B5 · Register screen — Friday.** Same shape as login. On success nothing to do — `register()` starts
the session (see A2) and the gate moves to the tabs. _(Changed 7/9 by A: this used to say "replace
with login, no session", which contradicted the demo order and the backend's 201 `{ tokens, user }`.)_
*Done when:* `register('taken', …)` shows the 409 and `register('boom', …)` shows the 500 without
crashing.

### C — Friend list and adding friends

**C1 · ConversationsPage — Friday.** `app/(tabs)/conversations.tsx`. Call `getFriends()` in an
effect, render a `FlatList`. `mutual: true` and `mutual: false` must look **visibly different** —
e.g. a "Pending" label and dimmed row for `false`. Handle loading, error and "no friends yet".
*Done when:* both kinds of friend render differently and an API error shows its message.

**C2 · Refetch on return — Friday.** Use `useFocusEffect` so coming back from AddFriendView shows
the new friend.
*Done when:* adding a friend and going back shows them in the list without restarting the app.

**C3 · AddFriendView — Saturday.** `app/add-friend.tsx`. One text input plus a button calling
`addFriend(username)`. Show the `status` from the **response** — `pending` or `friends` — don't
refetch the list to work it out.
*Done when:* `anna` shows "friends", any other name shows "pending", your own name shows the 400,
and `nobody` shows the 404.

**C4 · Remove friend — if there's time.** A row action calling `deleteFriend(username)`; it always
succeeds, so just remove the row.

### D — Map and sending snaps

**D1 · MapsPage, first half — Friday.** `app/(tabs)/map.tsx`. Install the packages and add the
config plugin (see [Setup](#setup--everyone-does-this-first)). Full-screen `MapView` centered on
your own position, with a marker for yourself. This task depends on nothing else, so it can start
before the API mock is ready.
*Done when:* the map fills the screen and centers on you, on a real phone.

**D2 · Recipient picker + send — Saturday.** `app/send-snap.tsx`, opened from the photo preview with
the photo URI. List friends from `getFriends()` filtered to **`mutual: true` only**, multi-select,
an optional caption input, and a send button calling
`sendSnap({ recipients, photo: { uri, mimetype }, text })`.
*Done when:* a 400 shows its message and the app doesn't freeze — the button re-enables and you can
try again.

**D3 · MapsPage, second half — Sunday.** Permission flow: ask on mount; if denied, show an
explanation and a "try again" button. Add fake friend markers from `lib/mockLocations.ts` —
positions are **local, not in `lib/api.ts`**, because no endpoint for them exists or is coming.
*Done when:* denying permission in phone settings shows the message and "try again" works.

### Everyone — Sunday and Monday

Sunday: reproduce every mock error on **your own** screens and fix what breaks.
Monday: buffer. Read every file in the repo, including the ones you didn't write, and ask the owner
about anything you can't explain. Push everything.

## Pace

| Day | What should be done |
| --- | --- |
| Thu 3/9 | A1, A2, B1, B2 |
| Fri 4/9 | B3, B4, B5, C1, C2, D1 |
| Sat 5/9 | A3, C3, D2 |
| Sun 6/9 | D3, error sweep on your own screens |
| Mon 7/9 | A4, everyone reads every file, push |

## API contract (binding)

Protected endpoints need `Authorization: Bearer <access_token>`. The base URL comes on Wednesday
(`localhost` only works in the simulator — a physical phone needs the computer's IP).

| Method | URL | Body | Response |
| --- | --- | --- | --- |
| POST | `/register` | `{ username, password }` | 201 `{ tokens, user }` |
| POST | `/login` | `{ username, password }` | 200 `{ tokens, user }` |
| GET | `/friends` | – | 200 `{ friends: ApiFriend[] }` |
| POST | `/friends` | `{ friend_username }` | 200 `{ status }` |
| DELETE | `/friends/:username` | – | 204 (empty body) |
| POST | `/snaps` | `multipart/form-data` | 201 |

`POST /snaps` fields: `file` (jpeg/png, max 10 MB), `recipients` (array of usernames), `text`
(optional caption).

```ts
type ApiUser = { username: string; created_at: string } // ISO string
type AuthResponse = {
  tokens: { access_token: string; refresh_token: string }
  user: ApiUser
}
type ApiFriend = { username: string; created_at: string; mutual: boolean }
type AddFriendResponse = { status: 'pending' | 'friends' }
```

Note that `GET /friends` returns `{ friends: [...] }` but our `getFriends()` returns the array —
`api.real.ts` unwraps it, so screens never see the envelope.

### The exports `lib/api.ts` must have

These signatures are binding. Nothing may change them, including the AI — say so in your prompts.

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

`ApiError` is what makes every screen's `catch` work identically against the mock and the real
backend. `setAccessToken` is what makes 401 happen naturally: no token → 401 on protected calls.

### Errors

Every error from the backend has the same shape, and `message` is written for the user — show it,
don't invent your own text.

```json
{ "success": false, "code": 400, "message": "You are not friends with moises" }
```

Handle 400 (bad input), 401 (missing/invalid token), 404, 409 (already exists) and 500. In
`api.real.ts` on Wednesday: `API_BASE_URL` at the top, anything not 2xx →
`throw new ApiError(body.code, body.message)`, or `new ApiError(status, 'Något gick fel')` if the
body isn't JSON.

### Friendship model

A friendship is two directed links. A adds B → the link A → B exists. When B also adds A, they're
friends.

| Situation | `mutual` | In `/friends`? |
| --- | --- | --- |
| We added them, they haven't answered | `false` | Yes |
| Both added each other | `true` | Yes |
| They added us, we haven't answered | – | No — built together on Wednesday |

`POST /friends` answers `pending` or `friends` — show it directly, don't refetch.
`DELETE /friends/:username` only removes your own link and always returns 204.

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

## Don't build this week

WebSocket client, S3 upload logic, push notifications, viewing received snaps.
If you're ahead: UI space for incoming friend requests (no logic), a ChatView skeleton, animations,
dark mode.

## Questions for Ahmad

Found by reading the backend. Rule 1 says we raise these instead of working around them. All three
affect Wednesday's swap, so they go in the group chat before Tuesday.

**1. Access tokens live 60 seconds and there is no refresh endpoint.** `generateFreshTokens` in
`backend/src/http/controllers.ts` signs the access token with `expiresIn: "60s"`. The refresh token
lasts 10 years, but no route consumes it and `/refresh` isn't in the contract. So a *correct*
centralized `401 → logout` throws the user back to login one minute after signing in. Refresh
endpoint on Tuesday, or a longer expiry?

**2. 401 from protected routes isn't the error envelope.** The guard in `backend/src/auth.ts` does
`reply.status(401).send('Not authorized')` — plain text, not `{ success, code, message }`. Our
non-JSON fallback handles it without crashing, but the message won't match the mock's. Everything
thrown through the error handler (`Invalid password!` and friends) is fine — it's only the guard.

**3. How is `recipients` encoded in the multipart body?** `controllers.sendSnap` reads
`req.body.recipients`, and backend point 11 is where that gets finished — but the frontend has to
pick the encoding now so the two match. Proposal: append `recipients` once per username to the
`FormData`.

## Backend points — only once 1–9 are done and pushed

Don't touch existing endpoints. Propose new ones in the group chat before building.

10. Backend running locally: `docker compose up -d`, `.env`, `bunx dbmate up`, test `/register` and `/login`.
11. Finish `POST /snaps`: reply 201, read `recipients` and `text` from the multipart fields (the DB part of `services.sendSnap` exists).
12. `GET /snaps/:id`: a snap you're a recipient of, responding with a presigned URL (`getPresignedUrl` exists). Propose the response format first.
13. Expiry: snaps past `expires_at` can't be fetched and get deleted (row + S3 object).
14. Incoming friend requests: new endpoint, don't change `GET /friends`.
15. WebSockets for text messages (`@fastify/websocket`) — Wednesday's topic.

## Checklist before Tuesday

- [x] `lib/api.ts` exports the exact signatures, `ApiError` and `setAccessToken` — A
- [x] No `fetch` outside `lib/` — everyone (checked 7/9: `grep fetch app components` is empty)
- [ ] Register/login against the mock, tokens persist, app opens logged in after restart — B
- [ ] Friend list shows `mutual: true` and `false` differently — C
- [ ] Add friend shows `pending` / `friends` — C
- [ ] Camera → preview → recipient picker (`mutual: true` only) → send — A + D (camera/preview done, camera resets after send; picker is D)
- [ ] MapsPage shows the map with your own position — D
- [x] 401 and 409 don't crash the app; 401 routes to login — A
- [x] `bunx expo lint` and `bunx tsc --noEmit` are clean — everyone (clean on `main` 7/9; re-check after D merges)
- [ ] Everyone can explain every file — everyone
- [ ] Pushed to `main`

Not going to make it? Still show up, but post in the group chat before Monday night what's missing
and which backend points (if any) we got to.

## Demo order for Wednesday

Keeps the run-through short and hits every checklist item:

register (logs you in) → force-quit and reopen to show auto-login → friend list with one `mutual: true` and one
`false` → add `anna` (`friends`) and another name (`pending`) → camera → preview → pick recipients →
send → map → then the errors: `login('nobody')`, `register('taken')`, `register('boom')`, adding
yourself, and a 401 dropping back to login.
