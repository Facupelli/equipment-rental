import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { RateStructure } from "../../domain/models/rate-structure.model";
import { Money } from "../../domain/value-objects/money";
// biome-ignore lint: /style/useImportType
import { RateStructureRepository } from "../../infrastructure/persistence/typeorm/rate-structure.repository";
import { CreateRateStructureCommand } from "./create-rate-structure.command";

@CommandHandler(CreateRateStructureCommand)
export class CreateRateStructureHandler
	implements ICommandHandler<CreateRateStructureCommand>
{
	constructor(private readonly rateStructureRepo: RateStructureRepository) {}

	async execute(command: CreateRateStructureCommand): Promise<void> {
		const rateStructure = new RateStructure(
			crypto.randomUUID(),
			command.equipmentTypeId,
			new Money(command.hourlyRate),
			new Money(command.dailyRate),
			new Money(command.minimumCharge),
			command.taxPercentage,
			command.effectiveFrom,
			command.effectiveTo,
		);

		if (!rateStructure.isEffectiveAt(command.effectiveFrom)) {
			throw new Error(
				"Rate structure is not valid for the given effective dates",
			);
		}

		await this.rateStructureRepo.save(rateStructure);
	}
}
