import { BaseDomainEvent } from "src/shared/domain/domain-event";

export class ReservationCancelledEvent extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly customerId: string,
    public readonly equipmentTypeId: string,
    public readonly reason?: string
  ) {
    super("ReservationCancelled");
  }
}
