export class GetOwnerQuery {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
  ) {}
}
