import { Location } from "src/modules/inventory/domain/models/location.model";
import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "inventory", name: "locations" })
export class LocationEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column({ length: 120 })
	name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@CreateDateColumn()
	created_at: Date;
}

export const locationMapper = {
	toDomain(entity: LocationEntity): Location {
		return Location.reconstitute(
			entity.id,
			entity.name,
			entity.description,
			entity.created_at,
		);
	},

	toEntity(domain: Location): LocationEntity {
		const entity = new LocationEntity();
		entity.id = domain.id;
		entity.name = domain.name;
		entity.description = domain.description;
		entity.created_at = domain.createdAt;
		return entity;
	},
};
