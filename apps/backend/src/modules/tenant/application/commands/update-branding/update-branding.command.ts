export class UpdateTenantBrandingCommand {
  constructor(
    public readonly tenantId: string,
    public readonly logoUrl: string | null,
    public readonly faviconUrl: string | null,
  ) {}
}
