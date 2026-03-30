export class ActivateOrderCommand {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
