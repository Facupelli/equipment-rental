import { Reservation } from "../entities/reservation.entity";
import { ReservationId } from "../value-objects/reservation-id.vo";
import { ReservationStatus } from "../entities/reservation.entity";

/**
 * Repository Interface (Port)
 * Domain layer defines WHAT it needs, not HOW it's implemented
 * Infrastructure layer will provide the implementation
 */
export interface IReservationRepository {
  /**
   * Save a reservation (create or update)
   */
  save(reservation: Reservation): Promise<void>;

  /**
   * Find reservation by ID
   */
  findById(id: ReservationId): Promise<Reservation | null>;

  /**
   * Find overlapping reservations for availability checking
   */
  findOverlapping(
    equipmentTypeId: string,
    startDateTime: Date,
    endDateTime: Date,
    statuses: ReservationStatus[]
  ): Promise<Reservation[]>;

  /**
   * Find reservations by customer
   */
  findByCustomer(
    customerId: string,
    limit?: number,
    offset?: number
  ): Promise<Reservation[]>;

  /**
   * Delete reservation (for testing or admin operations)
   */
  delete(id: ReservationId): Promise<void>;
}

export const RESERVATION_REPOSITORY = Symbol("IReservationRepository");
