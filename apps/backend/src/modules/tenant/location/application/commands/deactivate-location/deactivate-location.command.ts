export class DeactivateLocationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
  ) {}
}
