import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Location } from "src/modules/inventory/domain/models/location.model";
// biome-ignore lint: /style/useImportType
import  { Repository } from "typeorm";
import { LocationEntity, locationMapper } from "./location.entity";

@Injectable()
export class LocationRepository {
	constructor(
    @InjectRepository(LocationEntity)
    private readonly repository: Repository<LocationEntity>
  ) {}

	async save(location: Location): Promise<void> {
		const entity = locationMapper.toEntity(location);
		await this.repository.save(entity);
	}
}
