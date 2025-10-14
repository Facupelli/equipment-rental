import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";

// Presentation
import { BookingController } from "./presentation/booking.controller";

// Application (Use Cases)
import { CreateReservationHandler } from "./application/commands/create-reservation/create-reservation.handler";
import { CheckAvailabilityHandler } from "./application/queries/check-availability/check-availability.handler";

// Domain Services
import { AvailabilityCheckerService } from "./domain/services/availability-checker.service";

// Infrastructure
import { ReservationSchema } from "./infrastructure/persistance/typeorm/reservation.schema";
import { ReservationRepository } from "./infrastructure/persistance/typeorm/reservation.repository";
import { BookingFacade } from "./booking.facade";
import { OutboxRepository } from "./infrastructure/persistance/outbox/outbox.repository";
import { OutboxSchema } from "./infrastructure/persistance/outbox/outbox.schema";
import { InventoryModule } from "../inventory/inventory.module";

const CommandHandlers = [CreateReservationHandler];

const QueryHandlers = [CheckAvailabilityHandler];

// Event Handlers (for reacting to other modules' events)
const EventHandlers = [
  // Add event handlers here (e.g., PaymentCompletedHandler)
];

/**
 * Booking Module (Clean Architecture)
 *
 * Organization:
 * - Domain: Core business logic (entities, value objects, interfaces)
 * - Application: Use cases (commands, queries, event handlers)
 * - Infrastructure: Technical implementations (repositories, adapters)
 * - Presentation: API layer (controllers)
 *
 * Dependency Rule:
 * Domain ← Application ← Infrastructure
 * Domain ← Application ← Presentation
 *
 * Domain has NO dependencies on outer layers!
 */
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
