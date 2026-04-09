export class GetCustomerProfileReviewQuery {
  constructor(
    public readonly tenantId: string,
    public readonly customerProfileId: string,
  ) {}
}
