import { BadRequestException, ConflictException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { Allocation } from "src/modules/booking/domain/models/allocation.model";
import {
	ReservationOrder,
	ReservationOrderStatus,
} from "src/modules/booking/domain/models/reservation-order.model";
import { ReservationOrderItem } from "src/modules/booking/domain/models/reservation-order-item.model";
// biome-ignore lint: /style/useImportType
import { ReservationOrderRepository } from "src/modules/booking/infrastructure/persistance/typeorm/reservation-order.repository";
// biome-ignore lint: /style/useImportType
import { InventoryFacade } from "src/modules/inventory/inventory.facade";
// biome-ignore lint: /style/useImportType
import { OutboxService } from "src/modules/outbox/application/outbox.service";
// biome-ignore lint: /style/useImportType
import { PricingFacade } from "src/modules/pricing/pricing.facade";
// biome-ignore lint: /style/useImportType
import { UserFacade } from "src/modules/user/user.facade";
// biome-ignore lint: /style/useImportType
import { UnitOfWork } from "src/shared/infrastructure/database/unit-of-work.service";
import { validateDateRange } from "src/shared/utils/date-range.utils";
import { v4 as uuidv4 } from "uuid";
// biome-ignore lint: /style/useImportType
import { AvailabilityCheckerService } from "../../../domain/services/availability-checker.service";
import { CreateReservationCommand } from "./create-reservation.command";

@CommandHandler(CreateReservationCommand)
export class CreateReservationHandler
	implements ICommandHandler<CreateReservationCommand, string>
{
	constructor(
		private readonly reservationOrderRepository: ReservationOrderRepository,
		private readonly availabilityChecker: AvailabilityCheckerService,
		private readonly outboxService: OutboxService,
		private readonly inventoryFacade: InventoryFacade,
		private readonly userFacade: UserFacade,
		private readonly pricingFacade: PricingFacade,
		private readonly unitOfWork: UnitOfWork,
	) {}

	async execute(command: CreateReservationCommand): Promise<string> {
		const userExists = await this.userFacade.exists(command.customerId);
		if (!userExists) {
			throw new BadRequestException(
				`Customer with ID ${command.customerId} not found`,
			);
		}

		try {
			validateDateRange(command.startDateTime, command.endDateTime);
		} catch (error) {
			throw new BadRequestException(error.message);
		}

		const totalInventory = await this.inventoryFacade.getTotalCapacity(
			command.equipmentTypeId,
		);

		console.log({ totalInventory });

		const itemIds = await this.availabilityChecker.checkAvailability({
			equipmentTypeId: command.equipmentTypeId,
			startDate: command.startDateTime,
			endDate: command.endDateTime,
			quantity: command.quantity,
			totalInventory,
			// TODO
			bufferDays: 0,
		});

		console.log({ itemIds });

		if (!itemIds || itemIds.length === 0) {
			throw new ConflictException(
				"Equipment not available for the requested time range",
			);
		}

		const quote = await this.pricingFacade.calculateQuote({
			equipmentTypeId: command.equipmentTypeId,
			startDate: command.startDateTime,
			endDate: command.endDateTime,
			customerId: command.customerId,
			promoCode: command.promoCode,
			quantity: command.quantity,
		});

		const allocations = itemIds.map(
			(itemId) =>
				new Allocation(
					uuidv4(),
					itemId,
					command.startDateTime,
					command.endDateTime,
				),
		);

		const reservationOrderItem = new ReservationOrderItem(
			uuidv4(),
			command.equipmentTypeId,
			command.quantity,
			quote,
			allocations,
		);

		const reservationOrder = new ReservationOrder(
			uuidv4(),
			command.customerId,
			[reservationOrderItem],
			ReservationOrderStatus.Pending,
			quote.total.amount,
			new Date(),
		);

		await this.unitOfWork.execute(async () => {
			await this.reservationOrderRepository.save(reservationOrder);

			await this.outboxService.saveEvent("ReservationCreated", {
				reservationId: reservationOrder.id,
				customerId: reservationOrder.customerId,
			});
		});

		return reservationOrder.id;
	}
}
