import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { Role } from "src/modules/iam/domain/models/role.model";
// biome-ignore lint: /style/useImportType
import { RoleRepository } from "src/modules/iam/infrastructure/persistence/typeorm/role.repository";
import { GetRolesQuery } from "./get-roles.query";

@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery, Role[]> {
	constructor(private readonly roleRepository: RoleRepository) {}

	async execute(): Promise<Role[]> {
		return await this.roleRepository.findAll();
	}
}
