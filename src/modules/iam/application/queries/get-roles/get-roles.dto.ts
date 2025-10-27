import type { Permission } from "src/modules/iam/domain/enums/permissions.enum";
import type { Role } from "src/modules/iam/domain/models/role.model";

export class RolesDto {
	id: string;
	name: string;
	description: string;
	permissions: Permission[];
	isSystemRole: boolean;
	createdAt: Date;

	constructor(
		id: string,
		name: string,
		description: string,
		permissions: Permission[],
		isSystemRole: boolean,
		createdAt: Date,
	) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.permissions = permissions;
		this.isSystemRole = isSystemRole;
		this.createdAt = createdAt;
	}
}

export const roleDtoMapper = {
	toDto(domain: Role): RolesDto {
		return new RolesDto(
			domain.id,
			domain.name,
			domain.description,
			domain.permissions,
			domain.isSystemRole,
			domain.createdAt,
		);
	},

	toDtoArray(domains: Role[]): RolesDto[] {
		return domains.map((domain) => roleDtoMapper.toDto(domain));
	},
};
