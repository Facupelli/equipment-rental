import { BaseDomainEvent } from "src/shared/domain/domain-event";

/**
 * Domain Event: ReservationConfirmed
 *
 * Published when a reservation transitions from PENDING to CONFIRMED status.
 * This event enables asynchronous workflow handoff to other modules (Inventory, Payment, Notifications).
 *
 * Contract: This event guarantees that the reservation has been persisted with CONFIRMED status
 * and represents a firm commitment that requires downstream actions (e.g., physical asset allocation).
 */
export class ReservationConfirmedEvent extends BaseDomainEvent {
  public readonly reservationId: string;
  public readonly equipmentTypeId: string;
  public readonly quantity: number;
  public readonly startTime: Date;
  public readonly endTime: Date;
  public readonly customerId: string;

  constructor(params: {
    reservationId: string;
    equipmentTypeId: string;
    quantity: number;
    startTime: Date;
    endTime: Date;
    customerId: string;
  }) {
    super("ReservationConfirmed");
    this.reservationId = params.reservationId;
    this.equipmentTypeId = params.equipmentTypeId;
    this.quantity = params.quantity;
    this.startTime = params.startTime;
    this.endTime = params.endTime;
    this.customerId = params.customerId;
  }
}
