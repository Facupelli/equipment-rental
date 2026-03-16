export type CreateOrderItemCommand =
  | { type: 'PRODUCT'; productTypeId: string; assetId?: string }
  | { type: 'BUNDLE'; bundleId: string };

export class CreateOrderCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly customerId: string,
    public readonly period: { start: Date; end: Date },
    public readonly pickupTime: number,
    public readonly returnTime: number,
    public readonly items: CreateOrderItemCommand[],
    public readonly currency: string,
  ) {}
}
