import { NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { UserRoles } from "src/modules/iam/domain/models/user-roles.model";
// biome-ignore lint: /style/useImportType
import { RoleRepository } from "src/modules/iam/infrastructure/persistence/typeorm/role.repository";
// biome-ignore lint: /style/useImportType
import { UserRepository } from "src/modules/iam/infrastructure/persistence/typeorm/user.repository";
// biome-ignore lint: /style/useImportType
import { UserRolesRepository } from "src/modules/iam/infrastructure/persistence/typeorm/user-roles.repository";
import { AssignRoleCommand } from "./assign-role.command";

@CommandHandler(AssignRoleCommand)
export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand> {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly roleRepository: RoleRepository,
		private readonly userRolesRepository: UserRolesRepository,
	) {}

	async execute(command: AssignRoleCommand): Promise<void> {
		const { userId, roleId } = command;

		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		const role = await this.roleRepository.findById(roleId);
		if (!role) {
			throw new NotFoundException(`Role with ID ${roleId} not found`);
		}

		let userRoles = await this.userRolesRepository.findByUserId(userId);

		if (!userRoles) {
			userRoles = new UserRoles(userId, []);
		}

		userRoles.assignRole(roleId);

		await this.userRolesRepository.save(userRoles);
	}
}
