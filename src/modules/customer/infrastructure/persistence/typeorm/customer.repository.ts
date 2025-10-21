import { Injectable } from "@nestjs/common";
import type { Customer } from "src/modules/customer/domain/models/customer.model";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "src/shared/infrastructure/database/transaction-context";
import { BaseRepository } from "src/shared/infrastructure/persistence/base-repository";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { CustomerEntity, CustomerMapper } from "./customer.entity";

@Injectable()
export class CustomerRepository extends BaseRepository<CustomerEntity> {
	constructor(dataSource: DataSource, txContext: TransactionContext) {
		super(CustomerEntity, dataSource, txContext);
	}

	async save(customer: Customer): Promise<void> {
		const entity = CustomerMapper.toEntity(customer);
		await this.managerRepo.save(entity);
	}

	async findById(id: string): Promise<Customer | null> {
		const entity = await this.managerRepo.findOne({
			where: { id },
		});
		return entity ? CustomerMapper.toDomain(entity) : null;
	}

	async findByEmail(email: string): Promise<Customer | null> {
		const normalizedEmail = email.trim().toLowerCase();
		const entity = await this.managerRepo.findOne({
			where: { email: normalizedEmail },
		});
		return entity ? CustomerMapper.toDomain(entity) : null;
	}

	async existsByEmail(email: string): Promise<boolean> {
		const normalizedEmail = email.trim().toLowerCase();
		const count = await this.managerRepo.count({
			where: { email: normalizedEmail },
		});
		return count > 0;
	}
}
