import { Module } from "@nestjs/common";
import { InventoryFacade } from "./inventory.facade";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EquipmentItemEntity } from "./infrastructure/persistence/typeorm/equipment-item.entity";
import { RegisterEquipmentHandler } from "./application/commands/register-equipment/register-equipment.handler";
import { GetTotalCapacityHandler } from "./application/queries/get-total-capacity/get-total-capacity.handler";
import { EquipmentItemRepository } from "./infrastructure/persistence/typeorm/equipment-item.repository";
import { ReservationConfirmedHandler } from "./application/event-handlers/reservation-confirmed.handler";

const CommandHandlers = [RegisterEquipmentHandler];
const QueryHandlers = [GetTotalCapacityHandler];
const EventHandlers = [ReservationConfirmedHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([EquipmentItemEntity])],
  providers: [
    InventoryFacade,
    // Application
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,

    // Infrastructure
    EquipmentItemRepository,
  ],
  exports: [InventoryFacade],
})
export class InventoryModule {}
