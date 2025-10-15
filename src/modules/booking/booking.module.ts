import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingController } from "./presentation/booking.controller";
import { CreateReservationHandler } from "./application/commands/create-reservation/create-reservation.handler";
import { CheckAvailabilityHandler } from "./application/queries/check-availability/check-availability.handler";
import { AvailabilityCheckerService } from "./domain/services/availability-checker.service";
import { BookingFacade } from "./booking.facade";
import { OutboxRepository } from "./infrastructure/persistance/outbox/outbox.repository";
import { OutboxSchema } from "./infrastructure/persistance/outbox/outbox.schema";
import { InventoryModule } from "../inventory/inventory.module";
import { ConfirmReservationHandler } from "./application/commands/confirm-reservation/confirm-reservation.handler";
import { ReservationOrderSchema } from "./infrastructure/persistance/typeorm/reservation-order.schema";
import { ReservationOrderItemSchema } from "./infrastructure/persistance/typeorm/reservation-order-item.schema";
import { ReservationOrderRepository } from "./infrastructure/persistance/typeorm/reservation-order.repository";
import { ReservationOrderItemRepository } from "./infrastructure/persistance/typeorm/reservation-order-item.repository";

const CommandHandlers = [CreateReservationHandler, ConfirmReservationHandler];
const QueryHandlers = [CheckAvailabilityHandler];
const EventHandlers = [];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      ReservationOrderSchema,
      ReservationOrderItemSchema,
      OutboxSchema,
    ]),
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
    ReservationOrderRepository,
    ReservationOrderItemRepository,
  ],
  exports: [
    // Export facade for other modules to use
    // We'll create this in the next step
    BookingFacade,
  ],
})
export class BookingModule {}
