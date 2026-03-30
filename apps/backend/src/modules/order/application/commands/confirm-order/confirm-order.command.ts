export class ConfirmOrderCommand {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
