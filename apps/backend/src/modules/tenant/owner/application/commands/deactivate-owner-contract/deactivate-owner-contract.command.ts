export class DeactivateOwnerContractCommand {
  constructor(
    public readonly tenantId: string,
    public readonly contractId: string,
  ) {}
}
