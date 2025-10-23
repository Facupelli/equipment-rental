import { User, UserStatus } from "src/modules/user/domain/models/user.model";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	Unique,
} from "typeorm";

@Unique("UQ_customer_email", ["email"])
@Entity({ schema: "user", name: "users" })
export class UserEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column("varchar", { length: 255 })
	name: string;

	@Column("varchar", { length: 255 })
	email: string;

	@Column("varchar", { length: 20 })
	phone: string;

	@Column("varchar", { length: 255 })
	passwordHash: string;

	@Column({ type: "timestamp", nullable: true })
	last_login_at: Date | null;

	@Column({ type: "enum", enum: UserStatus })
	@Index()
	status: UserStatus;

	@CreateDateColumn()
	registered_at: Date;
}

export const UserMapper = {
	toDomain(entity: UserEntity): User {
		return User.create({
			id: entity.id,
			name: entity.name,
			email: entity.email,
			phone: entity.phone,
			passwordHash: entity.passwordHash,
		});
	},

	toEntity(domain: User): UserEntity {
		const entity = new UserEntity();
		entity.id = domain.id;
		entity.name = domain.name;
		entity.email = domain.email;
		entity.phone = domain.phone;
		entity.status = domain.status;
		entity.last_login_at = domain.lastLoginAt;
		entity.registered_at = domain.registeredAt;
		entity.passwordHash = domain.passwordHash;
		return entity;
	},
};
