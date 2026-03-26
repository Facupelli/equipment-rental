export class TenantRegisteredEvent {
  constructor(
    public readonly tenantId: string,
    public readonly adminUserId: string,
    public readonly adminEmail: string,
    public readonly slug: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
