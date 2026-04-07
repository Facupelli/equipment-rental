import { FulfillmentMethod } from '@repo/types';

export type CreateOrderItemCommand =
  | { type: 'PRODUCT'; productTypeId: string; quantity?: number; assetId?: string }
  | { type: 'BUNDLE'; bundleId: string };

export type CreateOrderDeliveryRequestCommand = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  instructions?: string | null;
};

export class CreateOrderCommand {
  public readonly tenantId: string;
  public readonly locationId: string;
  public readonly customerId: string | undefined;
  public readonly period: { start: Date; end: Date };
  public readonly pickupTime: number;
  public readonly returnTime: number;
  public readonly items: CreateOrderItemCommand[];
  public readonly currency: string;
  public readonly insuranceSelected: boolean;
  public readonly fulfillmentMethod: FulfillmentMethod;
  public readonly deliveryRequest: CreateOrderDeliveryRequestCommand | undefined;
  public readonly couponCode?: string;

  constructor(props: {
    tenantId: string;
    locationId: string;
    customerId: string | undefined;
    period: { start: Date; end: Date };
    pickupTime: number;
    returnTime: number;
    items: CreateOrderItemCommand[];
    currency: string;
    insuranceSelected: boolean;
    fulfillmentMethod: FulfillmentMethod;
    deliveryRequest?: CreateOrderDeliveryRequestCommand;
    couponCode?: string;
  }) {
    this.tenantId = props.tenantId;
    this.locationId = props.locationId;
    this.customerId = props.customerId;
    this.period = props.period;
    this.pickupTime = props.pickupTime;
    this.returnTime = props.returnTime;
    this.items = props.items;
    this.currency = props.currency;
    this.insuranceSelected = props.insuranceSelected;
    this.fulfillmentMethod = props.fulfillmentMethod;
    this.deliveryRequest = props.deliveryRequest;
    this.couponCode = props.couponCode;
  }
}
