import { Body, Controller, Get, Param, Post } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { AssignRoleCommand } from "../application/commands/assign-role/assign-role.command";
// biome-ignore lint: /style/useImportType
import { AssignRoleDto } from "../application/commands/assign-role/assign-role.dto";
// biome-ignore lint: /style/useImportType
import { GetUserByIdDto } from "../application/queries/get-user-by-id/get-user-by-id.dto";
import { GetUserByIdQuery } from "../application/queries/get-user-by-id/get-user-by-id.query";
import type { User } from "../domain/models/user.model";

@Controller("users")
export class UserController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get(":userId")
  async getUserById(@Param() params: GetUserByIdDto): Promise<User | null> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(
      params.userId,
    ));

    return user;
  }

	@Post(":userId/role")
	async assignRole(
		@Param() params: GetUserByIdDto,
		@Body() dto: AssignRoleDto,
	): Promise<void> {
		return this.commandBus.execute(
			new AssignRoleCommand(params.userId, dto.roleId),
		);
	}
}
