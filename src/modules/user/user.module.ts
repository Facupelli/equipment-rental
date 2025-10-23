import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegisterUserHandler } from "./application/commands/register-user/register-user.handler";
import { GetUserByIdHandler } from "./application/queries/get-user-by-id.handler";
import { UserEntity } from "./infrastructure/persistence/typeorm/user.entity";
import { UserRepository } from "./infrastructure/persistence/typeorm/user.repository";
import { UserController } from "./presentation/user.controller";
import { UserFacade } from "./user.facade";

const CommandHandlers = [RegisterUserHandler];
const QueryHandlers = [GetUserByIdHandler];
const EventHandlers = [];

@Module({
	imports: [CqrsModule, TypeOrmModule.forFeature([UserEntity])],
	controllers: [UserController],
	providers: [
		UserFacade,
		// Application
		...CommandHandlers,
		...QueryHandlers,
		...EventHandlers,

		// Infrastructure
		UserRepository,
	],
	exports: [UserFacade],
})
export class UserModule {}
