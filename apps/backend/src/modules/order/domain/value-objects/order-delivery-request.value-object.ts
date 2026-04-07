type OrderDeliveryRequestProps = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  instructions: string | null;
};

export type CreateOrderDeliveryRequestProps = {
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

export class OrderDeliveryRequest {
  readonly recipientName: string;
  readonly phone: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly stateRegion: string;
  readonly postalCode: string;
  readonly country: string;
  readonly instructions: string | null;

  private constructor(props: OrderDeliveryRequestProps) {
    this.recipientName = OrderDeliveryRequest.normalizeRequired(props.recipientName);
    this.phone = OrderDeliveryRequest.normalizeRequired(props.phone);
    this.addressLine1 = OrderDeliveryRequest.normalizeRequired(props.addressLine1);
    this.addressLine2 = OrderDeliveryRequest.normalizeOptional(props.addressLine2);
    this.city = OrderDeliveryRequest.normalizeRequired(props.city);
    this.stateRegion = OrderDeliveryRequest.normalizeRequired(props.stateRegion);
    this.postalCode = OrderDeliveryRequest.normalizeRequired(props.postalCode);
    this.country = OrderDeliveryRequest.normalizeRequired(props.country);
    this.instructions = OrderDeliveryRequest.normalizeOptional(props.instructions);
  }

  static create(props: CreateOrderDeliveryRequestProps): OrderDeliveryRequest {
    return new OrderDeliveryRequest({
      recipientName: props.recipientName,
      phone: props.phone,
      addressLine1: props.addressLine1,
      addressLine2: props.addressLine2 ?? null,
      city: props.city,
      stateRegion: props.stateRegion,
      postalCode: props.postalCode,
      country: props.country,
      instructions: props.instructions ?? null,
    });
  }

  static reconstitute(props: OrderDeliveryRequestProps): OrderDeliveryRequest {
    return new OrderDeliveryRequest(props);
  }

  toJSON(): OrderDeliveryRequestProps {
    return {
      recipientName: this.recipientName,
      phone: this.phone,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      stateRegion: this.stateRegion,
      postalCode: this.postalCode,
      country: this.country,
      instructions: this.instructions,
    };
  }

  equals(other: OrderDeliveryRequest): boolean {
    return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
  }

  private static normalizeRequired(value: string): string {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Order delivery request fields cannot be empty.');
    }

    return trimmed;
  }

  private static normalizeOptional(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}
