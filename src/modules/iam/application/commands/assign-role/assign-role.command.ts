import type { ICommand } from "@nestjs/cqrs";

export class AssignRoleCommand implements ICommand {
	constructor(
		public readonly userId: string,
		public readonly roleId: string,
	) {}
}
