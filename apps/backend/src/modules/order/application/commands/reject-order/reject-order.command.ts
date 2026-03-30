export class RejectOrderCommand {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
