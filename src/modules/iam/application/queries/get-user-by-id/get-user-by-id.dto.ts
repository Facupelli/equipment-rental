import { createZodDto } from "nestjs-zod";
import type {
	User,
	UserStatus,
} from "src/modules/iam/domain/models/user.model";
import z from "zod";

const GetUserById = z.object({
	userId: z.uuid("Invalid User ID"),
});

export class GetUserByIdDto extends createZodDto(GetUserById) {}

export class UserDto {
	id: string;
	name: string;
	email: string;
	phone: string;
	status: UserStatus;
	registeredAt: Date;
	lastLoginAt: Date | null;

	constructor(
		id: string,
		name: string,
		email: string,
		phone: string,
		status: UserStatus,
		registeredAt: Date,
		lastLoginAt: Date | null,
	) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.phone = phone;
		this.status = status;
		this.registeredAt = registeredAt;
		this.lastLoginAt = lastLoginAt;
	}
}

export const userDtoMapper = {
	toDto(domain: User): UserDto {
		return new UserDto(
			domain.id,
			domain.name,
			domain.email,
			domain.phone,
			domain.status,
			domain.registeredAt,
			domain.lastLoginAt,
		);
	},
	toDtoArray(domains: User[]): UserDto[] {
		return domains.map((domain) => this.toDto(domain));
	},
};
