import { Body, Controller, Get, Post, Query } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateRateStructureCommand } from "../application/commands/create-rate-structure.command";
// biome-ignore lint: /style/useImportType
import  { CreateRateStructureDto } from "../application/commands/create-rate-structure.dto";
// biome-ignore lint: /style/useImportType
import  { GetActiveRateStructureDto } from "../application/queries/get-active-rate-structure/get-active-rate-structure.dto";
import { GetActiveRateStructureQuery } from "../application/queries/get-active-rate-structure/get-active-rate-structure.query";

@Controller("rate-structures")
export class RateStructureController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Post()
  async create(@Body() dto: CreateRateStructureDto): Promise<string> {
    const command = new CreateRateStructureCommand(
      dto.equipmentTypeId,
      dto.hourlyRate,
      dto.dailyRate,
      dto.minimumCharge,
      dto.taxPercentage,
      dto.effectiveFrom,
      dto.effectiveTo,
    );

    const rateStructure = await this.commandBus.execute(command);
    return rateStructure;
  }

	@Get("active")
  async getActive(@Query() dto: GetActiveRateStructureDto) {
    const query = new GetActiveRateStructureQuery(dto.equipmentTypeId, dto.date);
    const rateStructure = await this.queryBus.execute(query);

    return rateStructure
  }
}
