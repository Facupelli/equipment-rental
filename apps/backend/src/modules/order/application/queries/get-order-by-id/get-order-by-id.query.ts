export class GetOrderByIdQuery {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
