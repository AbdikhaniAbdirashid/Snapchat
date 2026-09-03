# Part A — my working notes

> The group's plan is [`SPRINT.md`](./SPRINT.md): the three rules, the route tree, everyone's tasks,
> the API contract, the mock error table and the checklist. That file wins if these two disagree.
> This one is just my own notes for Part A.

My scope: `lib/` and the API mock, the auth context shape, moving the camera into the navigation,
and the error sweep with the centralized 401.

## A1 · `lib/` and the mock — Thursday

Everyone else is blocked on this, so it lands first.

| File | Contents |
| --- | --- |
| `snap/lib/api.ts` | `export * from './api.mock'` → becomes `'./api.real'` on Wednesday |
| `snap/lib/api.types.ts` | the types + `ApiError` |
| `snap/lib/api.mock.ts` | the mock |
| `snap/lib/api.real.ts` | real `fetch`, stays empty until Wednesday |

Signatures are in [SPRINT.md](./SPRINT.md#the-exports-libapits-must-have) and are binding — tell the
AI so explicitly in every prompt.

Things I need to get right:

- delay 300–800 ms so the others' loading states are actually visible
- friends live in memory, so `addFriend` changes what `getFriends` returns
- seed both a `mutual: true` and a `mutual: false` friend
- **remember who logged in.** `login`/`register` store the username; `addFriend` compares against it
  for the 400 `You can't add yourself as a friend`, and `sendSnap` reads the friend list for the
  400 `You are not friends with …`. The real backend reads this off the JWT — the mock has to keep
  it itself. This is the bit I'll get asked about.
- `setAccessToken(null)` must make every protected call throw 401, so B's logout is testable

Full error table: [SPRINT.md](./SPRINT.md#mock-error-table).

**Done when:** every function can be made to return both a success and each of its errors.

## A2 · Auth context shape — Thursday, right after A1

B needs this the same day, so I define the file and types and he fills in the body. Screens never
touch SecureStore or `setAccessToken` directly — they go through the context.

```ts
type AuthState = {
  user: ApiUser | null
  isLoading: boolean                          // true while reading SecureStore at startup
  login(username, password): Promise<void>    // api.login + setAccessToken + SecureStore
  register(username, password): Promise<void>
  logout(): Promise<void>                     // setAccessToken(null) + clear SecureStore + go to login
}
```

**Done when:** B can build the auth gate without inventing his own token storage.

## A3 · Camera into the navigation — Saturday

`app/index.tsx` already has a working `CameraView` (double-tap flips it) that renders
`components/PhotoPreview.tsx` once a photo is taken. It moves to `app/(tabs)/index.tsx`, and the
preview gets a send button routing to D's `app/send-snap.tsx` with the photo URI.

**Done when:** taking a new photo after discarding one still works.

## A4 · Error sweep + centralized 401 — Monday

Walk every mock error on every screen together with whoever owns that screen. `401` clears the token
(`setAccessToken(null)`), clears SecureStore and routes to login — from **one** place, `logout()` in
`lib/auth-context.tsx`, never from an individual `catch`.

**Done when:** the checklist in SPRINT.md is ticked and `logout()` appears in exactly one file.

## Explaining my files on Wednesday

One sentence each. If a file can't get a sentence, it shouldn't be in the repo.

| File | What I say |
| --- | --- |
| `lib/api.types.ts` | The contract as types, plus `ApiError` carrying the HTTP code and the backend's own message. |
| `lib/api.mock.ts` | In-memory friends and current user, 300–800 ms delay, throws the same `ApiError`s the real backend does. |
| `lib/api.ts` | One line. It re-exports the mock today and the real client on Wednesday — that's the whole swap. |
| `lib/api.real.ts` | `fetch` with the bearer token, unwraps `{ friends }`, turns any non-2xx into an `ApiError`. |
| `lib/auth-context.tsx` | Where the token lives. `logout()` exists once here, so a 401 anywhere ends in the same place. |
| `app/(tabs)/index.tsx` | Camera; double-tap flips it, a photo hands off to the preview. |
| `components/PhotoPreview.tsx` | Shows the photo, discard returns to the camera, send goes to the recipient picker. |

The three backend problems I found are written up in
[SPRINT.md](./SPRINT.md#questions-for-ahmad) — the 60-second access token with no refresh endpoint
is the one that actually breaks Wednesday.

## Repo notes

- `plan.md` in the root is the original brainstorm sketch. Superseded by `SPRINT.md`.
- `snap/` still has the Expo starter template files (`hello-wave.tsx`, `parallax-scroll-view.tsx`,
  `ui/collapsible.tsx`, `themed-*.tsx`, `haptic-tab.tsx`, `hooks/`, `constants/theme.ts`,
  `scripts/reset-project.js`). Nothing under `app/` imports any of them — they only reference each
  other. Since the bar is "explain every file", they get deleted once B's navigation skeleton
  exists and I can be certain nothing needs them.
- I work on the `part-a` branch and merge into `main` when a task is done and works against the mock.
