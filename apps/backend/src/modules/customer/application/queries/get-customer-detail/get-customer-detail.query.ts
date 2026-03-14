export class GetCustomerDetailQuery {
  constructor(
    public readonly tenantId: string,
    public readonly customerId: string,
  ) {}
}
