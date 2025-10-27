import { Injectable } from "@nestjs/common";
import type { User } from "src/modules/iam/domain/models/user.model";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "src/shared/infrastructure/database/transaction-context";
import { BaseRepository } from "src/shared/infrastructure/persistence/base-repository";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { UserEntity, UserMapper } from "./user.entity";

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
	constructor(dataSource: DataSource, txContext: TransactionContext) {
		super(UserEntity, dataSource, txContext);
	}

	async save(customer: User): Promise<void> {
		const entity = UserMapper.toEntity(customer);
		await this.managerRepo.save(entity);
	}

	async findById(id: string): Promise<User | null> {
		const entity = await this.managerRepo.findOne({
			where: { id },
		});
		return entity ? UserMapper.toDomain(entity) : null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const normalizedEmail = email.trim().toLowerCase();
		const entity = await this.managerRepo.findOne({
			where: { email: normalizedEmail },
		});
		return entity ? UserMapper.toDomain(entity) : null;
	}

	async existsByEmail(email: string): Promise<boolean> {
		const normalizedEmail = email.trim().toLowerCase();
		const count = await this.managerRepo.count({
			where: { email: normalizedEmail },
		});
		return count > 0;
	}
}
