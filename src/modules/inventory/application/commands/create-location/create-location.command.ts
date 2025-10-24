import type { ICommand } from "@nestjs/cqrs";

export class CreateLocationCommand implements ICommand {
	constructor(
		public readonly name: string,
		public readonly description?: string,
	) {}
}
