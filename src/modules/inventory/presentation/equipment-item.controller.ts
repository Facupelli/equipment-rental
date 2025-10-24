import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
// biome-ignore lint:reason
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RegisterEquipmentCommand } from "../application/commands/register-equipment/register-equipment.command";
// biome-ignore lint: /style/useImportType
import { RegisterEquipmentDto } from "../application/commands/register-equipment/register-equipment.dto";
import { UpdateEquipmentStatusCommand } from "../application/commands/update-status/update-equipment-status.command";
// biome-ignore lint: /style/useImportType
import { UpdateEquipmentStatusDto, UpdateEquipmentStatusParamsDto } from "../application/commands/update-status/update-equipment-status.dto";
// biome-ignore lint: /style/useImportType
import { GetItemsByTypeDto } from "../application/queries/get-items-by-type/get-items-by-type.dto";
import { GetEquipmentItemsByTypeQuery } from "../application/queries/get-items-by-type/get-items-by-type.query";

@Controller("equipment-items")
export class EquipmentItemController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Post()
  async registerEquipmentItem(
    @Body() dto: RegisterEquipmentDto
  ): Promise<string> {
    const equipmentItem = await this.commandBus.execute(new RegisterEquipmentCommand(
      dto.equipmentTypeId,
      dto.currentLocationId,
      dto.serialNumber,
    ));

    return equipmentItem;
  }

	@Put(":equipmentItemId/status")
  async updateEquipmentStatus(
    @Param() params: UpdateEquipmentStatusParamsDto,
    @Body() dto: UpdateEquipmentStatusDto
  ): Promise<void> {
    await this.commandBus.execute(new UpdateEquipmentStatusCommand(
      params.equipmentItemId,
      dto.action,
      dto.reason,
    ));
  }

	@Get(':equipmentTypeId/items')
  async getItemsByType(
    @Param() params: GetItemsByTypeDto,
  ) {
    const query = new GetEquipmentItemsByTypeQuery(params.equipmentTypeId);
    return this.queryBus.execute(query);
  }
}
