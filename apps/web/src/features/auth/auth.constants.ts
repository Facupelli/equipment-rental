/**
 * Must match JWT_ACCESS_EXPIRATION_TIME_SECONDS in your NestJS env,
 * expressed in milliseconds.
 *
 * Used to set accessTokenExpiresAt on login and refresh — avoids decoding
 * the JWT payload just to read the exp claim.
 */
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes — adjust to your config
