import { FulfillmentMethod } from '@repo/types';

import { CreateOrderDeliveryRequestCommand, CreateOrderItemCommand } from '../create-order/create-order.command';

export class CreateDraftOrderCommand {
  public readonly tenantId: string;
  public readonly locationId: string;
  public readonly customerId: string | undefined;
  public readonly pickupDate: string;
  public readonly returnDate: string;
  public readonly pickupTime: number;
  public readonly returnTime: number;
  public readonly items: CreateOrderItemCommand[];
  public readonly currency: string;
  public readonly insuranceSelected: boolean;
  public readonly fulfillmentMethod: FulfillmentMethod;
  public readonly deliveryRequest: CreateOrderDeliveryRequestCommand | undefined;
  public readonly couponCode?: string;
  public readonly setByUserId: string;
  public readonly initialPricingAdjustment:
    | {
        mode: 'TARGET_TOTAL';
        targetTotal: string;
      }
    | undefined;

  constructor(props: {
    tenantId: string;
    locationId: string;
    customerId?: string;
    pickupDate: string;
    returnDate: string;
    pickupTime: number;
    returnTime: number;
    items: CreateOrderItemCommand[];
    currency: string;
    insuranceSelected: boolean;
    fulfillmentMethod: FulfillmentMethod;
    deliveryRequest?: CreateOrderDeliveryRequestCommand;
    couponCode?: string;
    setByUserId: string;
    initialPricingAdjustment?: {
      mode: 'TARGET_TOTAL';
      targetTotal: string;
    };
  }) {
    this.tenantId = props.tenantId;
    this.locationId = props.locationId;
    this.customerId = props.customerId;
    this.pickupDate = props.pickupDate;
    this.returnDate = props.returnDate;
    this.pickupTime = props.pickupTime;
    this.returnTime = props.returnTime;
    this.items = props.items;
    this.currency = props.currency;
    this.insuranceSelected = props.insuranceSelected;
    this.fulfillmentMethod = props.fulfillmentMethod;
    this.deliveryRequest = props.deliveryRequest;
    this.couponCode = props.couponCode;
    this.setByUserId = props.setByUserId;
    this.initialPricingAdjustment = props.initialPricingAdjustment;
  }
}
