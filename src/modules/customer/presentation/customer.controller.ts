import { Body, Controller, Get, Param, Post } from "@nestjs/common";
// biome-ignore lint:reason
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RegisterCustomerCommand } from "../application/commands/register-customer.command";
import type { RegisterCustomerDto } from "../application/commands/register-customer.dto";
import type { GetCustomerByIdDto } from "../application/queries/get-customer-by-id.dto";
import { GetCustomerByIdQuery } from "../application/queries/get-customer-by-id.query";
import type { Customer } from "../domain/models/customer.model";

@Controller("customers")
export class CustomerController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get(":customerId")
    async getCustomerById(@Param() params: GetCustomerByIdDto): Promise<Customer | null> {
      const customer = await this.queryBus.execute(new GetCustomerByIdQuery(
        params.customerId,
      ));
  
      return customer;
    }

	@Post()
    async createCategory(
      @Body() dto: RegisterCustomerDto
    ): Promise<string> {
      const category = await this.commandBus.execute(new RegisterCustomerCommand(
        dto.name,
        dto.email,
        dto.phone,
      ));
  
      return category;
    }
}
