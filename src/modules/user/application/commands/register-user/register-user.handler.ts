import { ConflictException, Injectable } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../../domain/models/user.model";
// biome-ignore lint: /style/useImportType
import { UserRepository } from "../../../infrastructure/persistence/typeorm/user.repository";
import { RegisterUserCommand } from "./register-user.command";

@CommandHandler(RegisterUserCommand)
@Injectable()
export class RegisterUserHandler
	implements ICommandHandler<RegisterUserCommand, string>
{
	constructor(private readonly userRepository: UserRepository) {}

	async execute(command: RegisterUserCommand): Promise<string> {
		const emailExists = await this.userRepository.existsByEmail(command.email);

		if (emailExists) {
			throw new ConflictException(
				`User with email ${command.email} already exists`,
			);
		}

		const hashedPassword = await bcrypt.hash(command.password, 10);

		const user = User.create({
			id: uuidv4(),
			name: command.name,
			email: command.email,
			phone: command.phone,
			passwordHash: hashedPassword,
		});

		await this.userRepository.save(user);
		return user.id;
	}
}
