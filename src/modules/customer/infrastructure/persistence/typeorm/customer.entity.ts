import {
	Customer,
	CustomerStatus,
} from "src/modules/customer/domain/models/customer.model";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	Unique,
} from "typeorm";

@Unique("UQ_customer_email", ["email"])
@Entity({ schema: "customer", name: "customer" })
export class CustomerEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column("varchar", { length: 255 })
	name: string;

	@Column("varchar", { length: 255 })
	email: string;

	@Column("varchar", { length: 20 })
	phone: string;

	@Column({ type: "enum", enum: CustomerStatus })
	@Index()
	status: CustomerStatus;

	@CreateDateColumn()
	registered_at: Date;
}

export const CustomerMapper = {
	toDomain(schema: CustomerEntity): Customer {
		return Customer.create({
			id: schema.id,
			email: schema.email,
			name: schema.name,
			phone: schema.phone,
		});
	},

	toEntity(entity: Customer): CustomerEntity {
		const schema = new CustomerEntity();
		schema.id = entity.id;
		schema.name = entity.name;
		schema.email = entity.email;
		schema.phone = entity.phone;
		schema.status = entity.status;
		schema.registered_at = entity.registeredAt;
		return schema;
	},
};
