import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Result } from 'src/core/result';
import { DuplicateRoleAssignmentError, UserInactiveError } from '../domain/errors/users.errors';
import { CreateRoleCommand } from './commands/create-role/create-role.command';
import { CreateUserCommand } from './commands/create-user/create-user.command';
import { RoleDto, UserDto, UsersPublicApi } from './users-public-api';

@Injectable()
export class UsersFacade implements UsersPublicApi {
  constructor(private readonly commandBus: CommandBus) {}

  async create(dto: UserDto): Promise<Result<string, UserInactiveError | DuplicateRoleAssignmentError>> {
    return await this.commandBus.execute<
      CreateUserCommand,
      Result<string, UserInactiveError | DuplicateRoleAssignmentError>
    >(new CreateUserCommand(dto.email, dto.passwordHash, dto.firstName, dto.lastName, dto.tenantId, dto.roleId));
  }

  async createRole(dto: RoleDto): Promise<string> {
    return await this.commandBus.execute<CreateRoleCommand, string>(
      new CreateRoleCommand(dto.code, dto.name, dto.description, dto.tenantId),
    );
  }
}
