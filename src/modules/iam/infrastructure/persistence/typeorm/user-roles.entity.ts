import { UserRoles } from "src/modules/iam/domain/models/user-roles.model";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity("user_roles")
@Index(["userId", "roleId"], { unique: true })
export class UserRoleEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	@Index()
	userId: string;

	@Column()
	roleId: string;

	@CreateDateColumn()
	assignedAt: Date;
}

export const userRolesMapper = {
	toDomain(userId: string, entities: UserRoleEntity[]): UserRoles {
		const roleIds = entities.map((e) => e.roleId);
		return new UserRoles(userId, roleIds);
	},

	toEntity(userId: string, roleIds: string[]): UserRoleEntity[] {
		return roleIds.map((roleId) => {
			const entity = new UserRoleEntity();
			entity.userId = userId;
			entity.roleId = roleId;
			return entity;
		});
	},
};
