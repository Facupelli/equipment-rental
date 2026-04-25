export type UpdateDraftOrderPricingItemCommand = {
  orderItemId: string;
  finalPrice: string;
};

export class UpdateDraftOrderPricingCommand {
  public readonly tenantId: string;
  public readonly orderId: string;
  public readonly setByUserId: string;
  public readonly mode: 'TARGET_TOTAL' | 'ITEMS';
  public readonly targetTotal: string | undefined;
  public readonly items: UpdateDraftOrderPricingItemCommand[] | undefined;

  constructor(props: {
    tenantId: string;
    orderId: string;
    setByUserId: string;
    mode: 'TARGET_TOTAL' | 'ITEMS';
    targetTotal?: string;
    items?: UpdateDraftOrderPricingItemCommand[];
  }) {
    this.tenantId = props.tenantId;
    this.orderId = props.orderId;
    this.setByUserId = props.setByUserId;
    this.mode = props.mode;
    this.targetTotal = props.targetTotal;
    this.items = props.items;
  }
}
