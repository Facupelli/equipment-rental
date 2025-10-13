import { BaseDomainEvent } from "src/shared/domain/domain-event";

export class ReservationConfirmedEvent extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly customerId: string,
    public readonly equipmentTypeId: string,
    public readonly startDateTime: Date,
    public readonly endDateTime: Date,
    public readonly quantity: number,
    public readonly quotedPrice: number
  ) {
    super("ReservationConfirmed");
  }
}
