import type { ICommand } from "@nestjs/cqrs";
import type { Permission } from "src/modules/iam/domain/enums/permissions.enum";

export class CreateRoleCommand implements ICommand {
	constructor(
		public readonly name: string,
		public readonly description: string,
		public readonly permissions: Permission[],
	) {}
}
