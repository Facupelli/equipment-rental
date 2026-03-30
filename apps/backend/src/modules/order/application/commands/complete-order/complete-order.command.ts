export class CompleteOrderCommand {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
