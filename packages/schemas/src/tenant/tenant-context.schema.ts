export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  customDomain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
};

export type ResolvedTenantContext =
  | { face: "platform" }
  | { face: "admin" }
  | { face: "portal"; tenant: TenantContext };
