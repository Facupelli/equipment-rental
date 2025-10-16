import { Body, Controller, Post } from "@nestjs/common";
// biome-ignore lint:reason
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RegisterEquipmentCommand } from "../application/commands/register-equipment/register-equipment.command";
import type { RegisterEquipmentDto } from "../application/commands/register-equipment/register-equipment.dto";

@Controller("equipment-items")
export class EquipmentItemController {
	constructor(
		private readonly commandBus: CommandBus,
	) {}


	@Post()
  async registerEquipmentItem(
    @Body() dto: RegisterEquipmentDto
  ): Promise<string> {
    const equipmentItem = await this.commandBus.execute(new RegisterEquipmentCommand(
      dto.equipmentTypeId,
      dto.serialNumber,
    ));

    return equipmentItem;
  }
}
