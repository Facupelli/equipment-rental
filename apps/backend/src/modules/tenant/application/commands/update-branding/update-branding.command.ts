export class UpdateTenantBrandingCommand {
  constructor(
    public readonly tenantId: string,
    public readonly logoUrl: string | null,
  ) {}
}
