import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssignRoleHandler } from "./application/commands/assign-role/assign-role.handler";
import { CreateRoleHandler } from "./application/commands/create-role/create-role.handler";
import { RegisterUserHandler } from "./application/commands/register-user/register-user.handler";
import { RevokeRoleHandler } from "./application/commands/revoke-role/revoke-role.handler";
import { GetRolesHandler } from "./application/queries/get-roles/get-roles.handler";
import { GetUserByIdHandler } from "./application/queries/get-user-by-id/get-user-by-id.handler";
import { AuthorizationFacade } from "./authorization.facade";
import { AuthenticationService } from "./domain/services/authentication.service";
import { AuthorizationService } from "./domain/services/authorization.service";
import { PermissionsGuard } from "./infrastructure/guards/permissions.guard";
import { RoleEntity } from "./infrastructure/persistence/typeorm/role.entity";
import { RoleRepository } from "./infrastructure/persistence/typeorm/role.repository";
import { UserEntity } from "./infrastructure/persistence/typeorm/user.entity";
import { UserRepository } from "./infrastructure/persistence/typeorm/user.repository";
import { UserRoleEntity } from "./infrastructure/persistence/typeorm/user-roles.entity";
import { UserRolesRepository } from "./infrastructure/persistence/typeorm/user-roles.repository";
import { JwtStrategy } from "./infrastructure/strategies/jwt.strategy";
import { LocalStrategy } from "./infrastructure/strategies/local.strategy";
import { AuthenticationController } from "./presentation/auth.controller";
import { RoleController } from "./presentation/role.controller";
import { UserController } from "./presentation/user.controller";
import { UserFacade } from "./user.facade";

const CommandHandlers = [
	RegisterUserHandler,
	AssignRoleHandler,
	RevokeRoleHandler,
	CreateRoleHandler,
];
const QueryHandlers = [GetUserByIdHandler, GetRolesHandler];
const EventHandlers = [];

@Module({
	imports: [
		PassportModule,
		CqrsModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get("jwt.secret"),
				signOptions: {
					expiresIn: "1h",
				},
			}),
			inject: [ConfigService],
		}),
		TypeOrmModule.forFeature([UserEntity, RoleEntity, UserRoleEntity]),
	],
	controllers: [AuthenticationController, UserController, RoleController],
	providers: [
		UserFacade,
		AuthorizationFacade,
		// Application
		...CommandHandlers,
		...QueryHandlers,
		...EventHandlers,

		// Services
		AuthenticationService,
		AuthorizationService,
		LocalStrategy,
		JwtStrategy,

		// Guards
		PermissionsGuard,

		// Infrastructure
		UserRepository,
		RoleRepository,
		UserRolesRepository,
	],
	exports: [UserFacade, AuthorizationFacade],
})
export class IamModule {}
