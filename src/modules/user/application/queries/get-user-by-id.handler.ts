import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { User } from "../../domain/models/user.model";
// biome-ignore lint: /style/useImportType
import { UserRepository } from "../../infrastructure/persistence/typeorm/user.repository";
import { GetUserByIdQuery } from "./get-user-by-id.query";

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler
	implements IQueryHandler<GetUserByIdQuery, User | null>
{
	constructor(private readonly userRepository: UserRepository) {}

	async execute(query: GetUserByIdQuery): Promise<User | null> {
		return await this.userRepository.findById(query.userId);
	}
}
