# snap — frontend

Expo SDK 54 app, runs in Expo Go. The plan, route tree, API contract and checklist live in
[`../SPRINT.md`](../SPRINT.md).

```bash
bun install
bunx expo start          # scan the QR code with Expo Go on a phone
bunx expo lint
bunx tsc --noEmit
```

- Every backend call goes through `lib/api.ts`. Today it re-exports the mock in `lib/api.mock.ts`;
  on Wednesday it re-exports `lib/api.real.ts` and nothing else changes.
- The session lives in `lib/auth-context.tsx`. Screens use `useAuth()` and never touch
  SecureStore or `setAccessToken`.
- Non-screen code goes in `components/` or `lib/`, never in `app/`.
