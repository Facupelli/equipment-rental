import { BadRequestException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { UserRolesRepository } from "src/modules/iam/infrastructure/persistence/typeorm/user-roles.repository";
import { RevokeRoleCommand } from "./revoke-role.command";

@CommandHandler(RevokeRoleCommand)
export class RevokeRoleHandler implements ICommandHandler<RevokeRoleCommand> {
	constructor(private readonly userRolesRepository: UserRolesRepository) {}

	async execute(command: RevokeRoleCommand): Promise<void> {
		const { userId, roleId } = command;

		const userRoles = await this.userRolesRepository.findByUserId(userId);

		if (!userRoles) {
			throw new BadRequestException(`No roles found for user ${userId}`);
		}

		userRoles.revokeRole(roleId);

		await this.userRolesRepository.save(userRoles);
	}
}
