import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { QueryBus } from "@nestjs/cqrs";
import { GetCustomerByIdQuery } from "./application/queries/get-customer-by-id.query";
import type { Customer } from "./domain/models/customer.model";

@Injectable()
export class CustomerFacade {
	constructor(private readonly queryBus: QueryBus) {}

	async exists(customerId: string): Promise<boolean> {
		const customer = await this.queryBus.execute(
			new GetCustomerByIdQuery(customerId),
		);
		return customer !== null;
	}

	async getCustomerById(customerId: string): Promise<Customer | null> {
		return this.queryBus.execute(new GetCustomerByIdQuery(customerId));
	}
}
