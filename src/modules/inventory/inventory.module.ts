import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateLocationHandler } from "./application/commands/create-location/create-location.handler";
import { RegisterEquipmentHandler } from "./application/commands/register-equipment/register-equipment.handler";
import { UpdateEquipmentStatusHandler } from "./application/commands/update-status/update-equipment-status.handler";
import { ReservationConfirmedHandler } from "./application/event-handlers/reservation-confirmed.handler";
import { GetEquipmentItemsByTypeHandler } from "./application/queries/get-items-by-type/get-items-by-type.handler";
import { GetTotalCapacityHandler } from "./application/queries/get-total-capacity/get-total-capacity.handler";
import { EquipmentItemEntity } from "./infrastructure/persistence/typeorm/equipment-item.entity";
import { EquipmentItemRepository } from "./infrastructure/persistence/typeorm/equipment-item.repository";
import { LocationEntity } from "./infrastructure/persistence/typeorm/location.entity";
import { LocationRepository } from "./infrastructure/persistence/typeorm/location.repository";
import { InventoryFacade } from "./inventory.facade";
import { EquipmentItemController } from "./presentation/equipment-item.controller";
import { LocationController } from "./presentation/location.controller";

const CommandHandlers = [
	RegisterEquipmentHandler,
	UpdateEquipmentStatusHandler,
	CreateLocationHandler,
];
const QueryHandlers = [GetTotalCapacityHandler, GetEquipmentItemsByTypeHandler];
const EventHandlers = [ReservationConfirmedHandler];

@Module({
	imports: [
		CqrsModule,
		TypeOrmModule.forFeature([EquipmentItemEntity, LocationEntity]),
	],
	controllers: [EquipmentItemController, LocationController],
	providers: [
		InventoryFacade,
		// Application
		...CommandHandlers,
		...QueryHandlers,
		...EventHandlers,

		// Infrastructure
		EquipmentItemRepository,
		LocationRepository,
	],
	exports: [InventoryFacade],
})
export class InventoryModule {}
