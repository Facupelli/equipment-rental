export type CreateOrderItemCommand =
  | { type: 'PRODUCT'; productTypeId: string; assetId?: string }
  | { type: 'BUNDLE'; bundleId: string };

export class CreateOrderCommand {
  constructor(
    public readonly locationId: string,
    public readonly customerId: string | null,
    public readonly period: { start: Date; end: Date },
    public readonly items: CreateOrderItemCommand[],
    public readonly currency: string,
  ) {}
}
