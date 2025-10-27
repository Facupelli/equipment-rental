import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Role } from "src/modules/iam/domain/models/role.model";
// biome-ignore lint: /style/useImportType
import { In, Repository } from "typeorm";
import { RoleEntity, roleMapper } from "./role.entity";

@Injectable()
export class RoleRepository {
	constructor(
        @InjectRepository(RoleEntity)
        private readonly repo: Repository<RoleEntity>,
    ) {}

	async findById(id: string): Promise<Role | null> {
		const entity = await this.repo.findOne({ where: { id } });
		return entity ? roleMapper.toDomain(entity) : null;
	}

	async findByIds(ids: string[]): Promise<Role[]> {
		if (ids.length === 0) return [];

		const entities = await this.repo.find({
			where: { id: In(ids) },
		});

		return entities.map((e) => roleMapper.toDomain(e));
	}

	async findAll(): Promise<Role[]> {
		const entities = await this.repo.find();
		return entities.map((e) => roleMapper.toDomain(e));
	}

	async save(role: Role): Promise<void> {
		const entity = roleMapper.toEntity(role);
		await this.repo.save(entity);
	}

	async delete(id: string): Promise<void> {
		await this.repo.delete(id);
	}
}
