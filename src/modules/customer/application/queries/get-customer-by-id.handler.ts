import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { Customer } from "../../domain/models/customer.model";
// biome-ignore lint: /style/useImportType
import { CustomerRepository } from "../../infrastructure/persistence/typeorm/customer.repository";
import { GetCustomerByIdQuery } from "./get-customer-by-id.query";

@QueryHandler(GetCustomerByIdQuery)
export class GetCustomerByIdHandler
	implements IQueryHandler<GetCustomerByIdQuery, Customer | null>
{
	constructor(private readonly customerRepository: CustomerRepository) {}

	async execute(query: GetCustomerByIdQuery): Promise<Customer | null> {
		return await this.customerRepository.findById(query.customerId);
	}
}
