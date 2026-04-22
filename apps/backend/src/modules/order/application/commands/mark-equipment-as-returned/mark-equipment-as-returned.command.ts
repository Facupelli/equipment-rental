export class MarkEquipmentAsReturnedCommand {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
