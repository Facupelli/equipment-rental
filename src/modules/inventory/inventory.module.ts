import { Module } from "@nestjs/common";
import { InventoryFacade } from "./inventory.facade";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EquipmentItemSchema } from "./infrastructure/persistence/typeorm/equipment-item.schema";
import { RegisterEquipmentHandler } from "./application/commands/register-equipment/register-equipment.handler";
import { GetTotalCapacityHandler } from "./application/queries/get-total-capacity/get-total-capacity.handler";
import { EquipmentItemRepository } from "./infrastructure/persistence/typeorm/equipment-item.repository";

const CommandHandlers = [RegisterEquipmentHandler];

const QueryHandlers = [GetTotalCapacityHandler];

const EventHandlers = [];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([EquipmentItemSchema])],
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
