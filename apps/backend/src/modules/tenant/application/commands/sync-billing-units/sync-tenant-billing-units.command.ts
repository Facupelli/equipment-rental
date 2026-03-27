export class SyncTenantBillingUnitsCommand {
  constructor(
    public readonly tenantId: string,
    public readonly billingUnitIds: string[],
  ) {}
}
