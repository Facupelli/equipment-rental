import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { Result } from 'src/core/result';
import { DuplicateRoleAssignmentError, UserInactiveError } from '../domain/errors/users.errors';
import { IsEmailTakenQuery } from './queries/is-email-taken/is-email-taken.query';
import { CreateRoleCommand } from './commands/create-role/create-role.command';
import { CreateUserCommand } from './commands/create-user/create-user.command';
import {
  BootstrapTenantAdminDto,
  BootstrapTenantAdminResult,
  RoleDto,
  UserDto,
  UsersPublicApi,
} from '../users.public-api';
import { BootstrapTenantAdminService } from './services/bootstrap-tenant-admin.service';

@Injectable()
export class UsersFacade implements UsersPublicApi {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly bootstrapTenantAdminService: BootstrapTenantAdminService,
  ) {}

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

  async isEmailTaken(email: string): Promise<boolean> {
    return await this.queryBus.execute<IsEmailTakenQuery, boolean>(new IsEmailTakenQuery(email));
  }

  async bootstrapTenantAdmin(
    tx: PrismaTransactionClient,
    dto: BootstrapTenantAdminDto,
  ): Promise<BootstrapTenantAdminResult> {
    return await this.bootstrapTenantAdminService.execute(tx, dto);
  }
}
