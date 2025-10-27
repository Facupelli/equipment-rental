import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { UserRoles } from "src/modules/iam/domain/models/user-roles.model";
// biome-ignore lint: /style/useImportType
import { Repository } from "typeorm";
import { UserRoleEntity, userRolesMapper } from "./user-roles.entity";

@Injectable()
export class UserRolesRepository {
	constructor(
        @InjectRepository(UserRoleEntity)
        private readonly repo: Repository<UserRoleEntity>,
    ) {}

	async findByUserId(userId: string): Promise<UserRoles | null> {
		const entities = await this.repo.find({ where: { userId } });

		if (entities.length === 0) {
			return null;
		}

		return userRolesMapper.toDomain(userId, entities);
	}

	async save(userRoles: UserRoles): Promise<void> {
		// Simple approach: delete all existing, insert new ones
		await this.repo.delete({ userId: userRoles.userId });

		if (userRoles.roleIds.length > 0) {
			const entities = userRolesMapper.toEntity(
				userRoles.userId,
				userRoles.roleIds,
			);
			await this.repo.save(entities);
		}
	}

	async deleteByUserId(userId: string): Promise<void> {
		await this.repo.delete({ userId });
	}
}
