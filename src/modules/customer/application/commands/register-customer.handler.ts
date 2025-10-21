import { ConflictException, Injectable } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { v4 as uuidv4 } from "uuid";
import { Customer } from "../../domain/models/customer.model";
// biome-ignore lint: /style/useImportType
import { CustomerRepository } from "../../infrastructure/persistence/typeorm/customer.repository";
import { RegisterCustomerCommand } from "../commands/register-customer.command";

@CommandHandler(RegisterCustomerCommand)
@Injectable()
export class RegisterCustomerHandler
	implements ICommandHandler<RegisterCustomerCommand, string>
{
	constructor(private readonly customerRepository: CustomerRepository) {}

	async execute(command: RegisterCustomerCommand): Promise<string> {
		const emailExists = await this.customerRepository.existsByEmail(
			command.email,
		);

		if (emailExists) {
			throw new ConflictException(
				`Customer with email ${command.email} already exists`,
			);
		}

		const customer = Customer.create({
			id: uuidv4(),
			name: command.name,
			email: command.email,
			phone: command.phone,
		});

		await this.customerRepository.save(customer);
		return customer.id;
	}
}
