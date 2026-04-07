export class GetUserProfileQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}
