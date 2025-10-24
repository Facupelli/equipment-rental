import { Body, Controller, Post } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { CommandBus } from "@nestjs/cqrs";
import { CreateLocationCommand } from "../application/commands/create-location/create-location.command";
// biome-ignore lint: /style/useImportType
import  { CreateLocationDto } from "../application/commands/create-location/create-location.dto";

@Controller("locations")
export class LocationController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post()
  async createLocation(
    @Body() dto: CreateLocationDto
  ){
    const locationId = await this.commandBus.execute(new CreateLocationCommand(
      dto.name,
      dto.description,
    ));

    return locationId;
  }
}
