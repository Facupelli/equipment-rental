// src/modules/booking/booking.facade.ts

import { Injectable } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateReservationCommand } from "./application/commands/create-reservation/create-reservation.command";
import { CheckAvailabilityQuery } from "./application/queries/check-availability/check-availability.query";

/**
 * Booking Facade (Anti-Corruption Layer)
 *
 * This is the ONLY public interface other modules should use.
 * It hides internal implementation details and provides a clean API.
 *
 * Benefits:
 * - Loose coupling between modules
 * - Easy to refactor internals without breaking consumers
 * - Clear contract for inter-module communication
 */
@Injectable()
export class BookingFacade {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  /**
   * Check if equipment is available for booking
   * Used by: Frontend, other modules
   */
  async checkAvailability(params: {
    equipmentTypeId: string;
    startDateTime: Date;
    endDateTime: Date;
    quantity: number;
  }): Promise<{
    isAvailable: boolean;
    remainingCapacity: number;
  }> {
    const result = await this.queryBus.execute(
      new CheckAvailabilityQuery(
        params.equipmentTypeId,
        params.startDateTime,
        params.endDateTime,
        params.quantity
      )
    );

    return {
      isAvailable: result.isAvailable,
      remainingCapacity: result.remainingCapacity,
    };
  }

  /**
   * Create a reservation
   * Used by: Frontend, other modules
   */
  async createReservation(params: {
    customerId: string;
    equipmentTypeId: string;
    startDateTime: Date;
    endDateTime: Date;
    quantity: number;
    notes?: string;
  }): Promise<string> {
    return await this.commandBus.execute(
      new CreateReservationCommand(
        params.customerId,
        params.equipmentTypeId,
        params.startDateTime,
        params.endDateTime,
        params.quantity,
        params.notes
      )
    );
  }

  // Add more public methods as needed
  // - confirmReservation(reservationId: string)
  // - cancelReservation(reservationId: string, reason?: string)
  // - getReservation(reservationId: string)
}
