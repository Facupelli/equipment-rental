import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { RoleRepository } from "src/modules/iam/infrastructure/persistence/typeorm/role.repository";
import { type RolesDto, roleDtoMapper } from "./get-roles.dto";
import { GetRolesQuery } from "./get-roles.query";

@QueryHandler(GetRolesQuery)
export class GetRolesHandler
	implements IQueryHandler<GetRolesQuery, RolesDto[]>
{
	constructor(private readonly roleRepository: RoleRepository) {}

	async execute(): Promise<RolesDto[]> {
		const roles = await this.roleRepository.findAll();
		return roles.map(roleDtoMapper.toDto);
	}
}
