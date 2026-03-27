export class FindUserCredentialsByEmailQuery {
  constructor(
    public readonly tenantId: string,
    public readonly email: string,
  ) {}
}
