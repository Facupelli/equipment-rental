export class InvalidBookingMutualExclusivityException extends Error {
  constructor() {
    super('Booking must have either inventoryItemId (Serialized) or quantity (Bulk), but not both, and not neither.');
    this.name = 'InvalidBookingMutualExclusivityException';
  }
}

export class InvalidBookingPriceException extends Error {
  constructor(message: string = 'Booking unit price must be non-negative.') {
    super(message);
    this.name = 'InvalidBookingPriceException';
  }
}
