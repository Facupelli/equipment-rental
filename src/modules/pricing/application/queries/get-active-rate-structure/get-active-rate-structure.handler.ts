import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { RateStructure } from "../../../domain/models/rate-structure.model";
// biome-ignore lint: /style/useImportType
import { RateStructureRepository } from "../../../infrastructure/persistence/typeorm/rate-structure.repository";
import { GetActiveRateStructureQuery } from "./get-active-rate-structure.query";

@QueryHandler(GetActiveRateStructureQuery)
export class GetActiveRateStructureHandler
	implements IQueryHandler<GetActiveRateStructureQuery>
{
	constructor(private readonly rateStructureRepo: RateStructureRepository) {}

	async execute(
		query: GetActiveRateStructureQuery,
	): Promise<RateStructure | null> {
		const rateStructure = await this.rateStructureRepo.findActiveRateForDate(
			query.equipmentTypeId,
			query.date,
		);

		return rateStructure;
	}
}
