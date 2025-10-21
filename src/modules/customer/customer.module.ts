import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegisterCustomerHandler } from "./application/commands/register-customer.handler";
import { GetCustomerByIdHandler } from "./application/queries/get-customer-by-id.handler";
import { CustomerFacade } from "./customer.facade";
import { CustomerEntity } from "./infrastructure/persistence/typeorm/customer.entity";
import { CustomerRepository } from "./infrastructure/persistence/typeorm/customer.repository";
import { CustomerController } from "./presentation/customer.controller";

const CommandHandlers = [RegisterCustomerHandler];
const QueryHandlers = [GetCustomerByIdHandler];
const EventHandlers = [];

@Module({
	imports: [CqrsModule, TypeOrmModule.forFeature([CustomerEntity])],
	controllers: [CustomerController],
	providers: [
		CustomerFacade,
		// Application
		...CommandHandlers,
		...QueryHandlers,
		...EventHandlers,

		// Infrastructure
		CustomerRepository,
	],
	exports: [CustomerFacade],
})
export class CustomerModule {}
