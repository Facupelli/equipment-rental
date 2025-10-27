import type { Permission } from "src/modules/iam/domain/enums/permissions.enum";
import { Role } from "src/modules/iam/domain/models/role.model";
import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("roles")
export class RoleEntity {
	@PrimaryColumn()
	id: string;

	@Column()
	name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@Column("simple-array")
	permissions: Permission[];

	@Column({ default: false })
	isSystemRole: boolean;

	@CreateDateColumn()
	createdAt: Date;
}

export const roleMapper = {
	toDomain(entity: RoleEntity): Role {
		return Role.reconstitute(
			entity.id,
			entity.name,
			entity.description,
			entity.permissions,
			entity.isSystemRole,
			entity.createdAt,
		);
	},

	toEntity(domain: Role): RoleEntity {
		const entity = new RoleEntity();
		entity.id = domain.id;
		entity.name = domain.name;
		entity.description = domain.description;
		entity.permissions = domain.permissions;
		entity.isSystemRole = domain.isSystemRole;
		entity.createdAt = domain.createdAt;
		return entity;
	},
};
