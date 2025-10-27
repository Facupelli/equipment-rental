import { NotFoundException } from "@nestjs/common";
import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { UserRepository } from "../../../infrastructure/persistence/typeorm/user.repository";
import { type UserDto, userDtoMapper } from "./get-user-by-id.dto";
import { GetUserByIdQuery } from "./get-user-by-id.query";

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler
	implements IQueryHandler<GetUserByIdQuery, UserDto>
{
	constructor(private readonly userRepository: UserRepository) {}

	async execute(query: GetUserByIdQuery): Promise<UserDto> {
		const user = await this.userRepository.findById(query.userId);

		if (!user) {
			throw new NotFoundException(`User with ID ${query.userId} not found`);
		}

		return userDtoMapper.toDto(user);
	}
}
