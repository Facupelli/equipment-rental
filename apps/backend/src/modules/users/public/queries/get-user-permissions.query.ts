export class GetUserPermissionsQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}
