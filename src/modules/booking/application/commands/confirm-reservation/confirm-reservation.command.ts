import { ReservationId } from "src/modules/booking/domain/value-objects/reservation-id.vo";

export class ConfirmReservationCommand {
  constructor(public readonly reservationId: ReservationId) {}
}
