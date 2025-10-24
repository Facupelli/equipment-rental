import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { Location } from "src/modules/inventory/domain/models/location.model";
// biome-ignore lint: /style/useImportType
import { LocationRepository } from "src/modules/inventory/infrastructure/persistence/typeorm/location.repository";
import { v4 as uuidv4 } from "uuid";
import { CreateLocationCommand } from "./create-location.command";

@CommandHandler(CreateLocationCommand)
export class CreateLocationHandler
	implements ICommandHandler<CreateLocationCommand>
{
	constructor(private readonly locationRepository: LocationRepository) {}

	async execute(command: CreateLocationCommand): Promise<string> {
		const location = Location.create(
			uuidv4(),
			command.name,
			command.description,
		);

		await this.locationRepository.save(location);
		return location.id;
	}
}
