// Swap snap/lib/api.ts to `export * from './api.real'` on Wednesday.
// On any non-2xx: throw new ApiError(body.code, body.message).
// On 401 from a protected route: call notifyUnauthorized() then throw.
