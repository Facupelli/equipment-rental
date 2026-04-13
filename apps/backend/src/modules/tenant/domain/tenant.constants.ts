/**
 * Slugs that can never be registered as tenant identifiers.
 *
 * This list is the single source of truth — both the tenant context resolver
 * and the tenant creation handler must import from here. Never duplicate this
 * list elsewhere.
 *
 * When adding entries: also verify the corresponding subdomain is not already
 * in use in your DNS / Cloudflare configuration.
 */
export const BANNED_TENANT_SLUGS: readonly string[] = [
  'app',
  'www',
  'api',
  'admin',
  'internal',
  'mail',
  'static',
  'equipment',
  'branding',
] as const;
