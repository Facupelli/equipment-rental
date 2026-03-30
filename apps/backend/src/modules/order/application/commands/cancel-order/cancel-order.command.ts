export class CancelOrderCommand {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
