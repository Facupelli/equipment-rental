import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RegisterUserCommand } from "./application/commands/register-user/register-user.command";
import type { RegisterUserDto } from "./application/commands/register-user/register-user.dto";
import { GetUserByIdQuery } from "./application/queries/get-user-by-id.query";
import type { User } from "./domain/models/user.model";
// biome-ignore lint: /style/useImportType
import { UserRepository } from "./infrastructure/persistence/typeorm/user.repository";

@Injectable()
export class UserFacade {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
	) {}

	async exists(customerId: string): Promise<boolean> {
		const customer = await this.queryBus.execute(
			new GetUserByIdQuery(customerId),
		);
		return customer !== null;
	}

	async getById(customerId: string): Promise<User | null> {
		return this.queryBus.execute(new GetUserByIdQuery(customerId));
	}

	async getByEmail(email: string): Promise<User | null> {
		return await this.userRepository.findByEmail(email);
	}

	async registerUser(dto: RegisterUserDto): Promise<string> {
		return this.commandBus.execute(
			new RegisterUserCommand(dto.name, dto.email, dto.phone, dto.password),
		);
	}
}
