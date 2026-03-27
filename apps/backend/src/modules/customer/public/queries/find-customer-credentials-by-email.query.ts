export class FindCustomerCredentialsByEmailQuery {
  constructor(
    public readonly email: string,
    public readonly tenantId: string,
  ) {}
}
