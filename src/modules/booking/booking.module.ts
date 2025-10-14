import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingController } from "./presentation/booking.controller";
import { CreateReservationHandler } from "./application/commands/create-reservation/create-reservation.handler";
import { CheckAvailabilityHandler } from "./application/queries/check-availability/check-availability.handler";
import { AvailabilityCheckerService } from "./domain/services/availability-checker.service";
import { ReservationSchema } from "./infrastructure/persistance/typeorm/reservation.schema";
import { ReservationRepository } from "./infrastructure/persistance/typeorm/reservation.repository";
import { BookingFacade } from "./booking.facade";
import { OutboxRepository } from "./infrastructure/persistance/outbox/outbox.repository";
import { OutboxSchema } from "./infrastructure/persistance/outbox/outbox.schema";
import { InventoryModule } from "../inventory/inventory.module";
import { ConfirmReservationHandler } from "./application/commands/confirm-reservation/confirm-reservation.handler";

const CommandHandlers = [CreateReservationHandler, ConfirmReservationHandler];
const QueryHandlers = [CheckAvailabilityHandler];
const EventHandlers = [];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ReservationSchema, OutboxSchema]),
    // Dependencies
    InventoryModule,
  ],
  controllers: [BookingController],
  providers: [
    // Outbox pattern
    OutboxRepository,

    BookingFacade,
    // Domain Services
    AvailabilityCheckerService,

    // Application Layer
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,

    // Infrastructure Layer (Repository)
    // {
    //   provide: RESERVATION_REPOSITORY,
    //   useClass: ReservationRepository,
    // },
    ReservationRepository,
  ],
  exports: [
    // Export facade for other modules to use
    // We'll create this in the next step
    BookingFacade,
  ],
})
export class BookingModule {}
