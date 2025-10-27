import { Body, Controller, Get, Post } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateRoleCommand } from "../application/commands/create-role/create-role.command";
import type { CreateRoleDto } from "../application/commands/create-role/create-role.dto";
import type { RolesDto } from "../application/queries/get-roles/get-roles.dto";
import { GetRolesQuery } from "../application/queries/get-roles/get-roles.query";

@Controller("roles")
export class RoleController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Post()
  async createRole(@Body() dto: CreateRoleDto): Promise<string> {
    return this.commandBus.execute(new CreateRoleCommand(dto.name, dto.description, dto.permissions));
  }

	@Get()
	async findAll(): Promise<RolesDto[]> {
		return this.queryBus.execute(new GetRolesQuery());
	}
}
