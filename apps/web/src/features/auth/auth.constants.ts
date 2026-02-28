// How long the access token lives — must match JWT_EXPIRATION_TIME_SECONDS in NestJS.
// We store the expiry timestamp in the session so the auth middleware can decide
// whether to proactively refresh without decoding the JWT on every request.
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
