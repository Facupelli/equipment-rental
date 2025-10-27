import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { Role } from "src/modules/iam/domain/models/role.model";
// biome-ignore lint: /style/useImportType
import { RoleRepository } from "src/modules/iam/infrastructure/persistence/typeorm/role.repository";
import { v4 as uuid } from "uuid";
import { CreateRoleCommand } from "./create-role.command";

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
	constructor(private readonly roleRepository: RoleRepository) {}

	async execute(command: CreateRoleCommand): Promise<string> {
		const { name, description, permissions } = command;

		const role = Role.create(uuid(), name, description, permissions, false);

		await this.roleRepository.save(role);
		return role.id;
	}
}
