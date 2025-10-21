import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerModule } from "../customer/customer.module";
import { InventoryModule } from "../inventory/inventory.module";
import { OutboxModule } from "../outbox/outbox.module";
import { ConfirmReservationHandler } from "./application/commands/confirm-reservation/confirm-reservation.handler";
import { CreateReservationHandler } from "./application/commands/create-reservation/create-reservation.handler";
import { CheckAvailabilityHandler } from "./application/queries/check-availability/check-availability.handler";
import { BookingFacade } from "./booking.facade";
import { AvailabilityCheckerService } from "./domain/services/availability-checker.service";
import { AllocationEntity } from "./infrastructure/persistance/typeorm/allocation.entity";
import { AllocationRepository } from "./infrastructure/persistance/typeorm/allocation.repository";
import { ReservationOrderEntity } from "./infrastructure/persistance/typeorm/reservation-order.entity";
import { ReservationOrderRepository } from "./infrastructure/persistance/typeorm/reservation-order.repository";
import { ReservationOrderItemEntity } from "./infrastructure/persistance/typeorm/reservation-order-item.entity";
import { ReservationOrderItemRepository } from "./infrastructure/persistance/typeorm/reservation-order-item.repository";
import { ReservationController } from "./presentation/reservation.controller";

const CommandHandlers = [CreateReservationHandler, ConfirmReservationHandler];
const QueryHandlers = [CheckAvailabilityHandler];
const EventHandlers = [];

@Module({
	imports: [
		CqrsModule,
		TypeOrmModule.forFeature([
			ReservationOrderEntity,
			ReservationOrderItemEntity,
			AllocationEntity,
		]),
		// Dependencies
		OutboxModule,
		InventoryModule,
		CustomerModule,
	],
	controllers: [ReservationController],
	providers: [
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
		AllocationRepository,
	],
	exports: [
		// Export facade for other modules to use
		// We'll create this in the next step
		BookingFacade,
	],
})
export class BookingModule {}
