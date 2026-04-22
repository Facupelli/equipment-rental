export class MarkEquipmentAsRetiredCommand {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
