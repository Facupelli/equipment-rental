import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepositoryPort } from '../../domain/ports/tenant.repository.port';
import { UsersPublicApi } from '../../../users/application/users-public-api';
import { Role } from '../../../users/domain/entities/role.entity';
import { User } from '../../../users/domain/entities/user.entity';
import { BcryptService } from '../../../auth/application/bcript.service';
import { CreateTenantUserCommand } from './create-tenant-user.command';
import { EmailAlreadyInUseError, CompanyNameAlreadyInUseError, TenantUserError } from '../errors/tenant-user.errors';
import { Result, ok, err } from '../../../../core/result';
import { IsSlugTakenQuery } from '../queries/is-slug-taken.query';

export interface CreateTenantUserResponse {
  userId: string;
  tenantId: string;
}

@CommandHandler(CreateTenantUserCommand)
export class CreateTenantUserCommandHandler implements ICommandHandler<CreateTenantUserCommand> {
  constructor(
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly queryBus: QueryBus,
    private readonly bcryptService: BcryptService,
    private readonly usersApi: UsersPublicApi,
  ) {}

  async execute(command: CreateTenantUserCommand): Promise<Result<CreateTenantUserResponse, TenantUserError>> {
    const { user, tenant } = command;

    const isEmailTaken = await this.usersApi.isEmailTaken(user.email);
    if (isEmailTaken) {
      return err(new EmailAlreadyInUseError());
    }

    const companySlug = tenant.name.toLowerCase().replaceAll(' ', '-');
    const isSlugTaken = await this.queryBus.execute<IsSlugTakenQuery, boolean>(new IsSlugTakenQuery(companySlug));
    if (isSlugTaken) {
      return err(new CompanyNameAlreadyInUseError());
    }

    // TODO: wrap in a transaction
    const tenantId = await this.createTenant(tenant.name, companySlug);
    const roleId = await this.createRole(tenantId);
    const userId = await this.createUserAndAssignRole(user, roleId, tenantId);

    return ok({ userId, tenantId });
  }

  private async createTenant(name: string, slug: string): Promise<string> {
    const tenant = Tenant.create({ name, slug });
    return this.tenantRepository.save(tenant);
  }

  private async createRole(tenantId: string): Promise<string> {
    const role = Role.create({
      name: 'Admin',
      description: 'Default administrator role',
      tenantId,
    });
    return this.usersApi.createRole(role);
  }

  private async createUserAndAssignRole(
    userDto: CreateTenantUserCommand['user'],
    roleId: string,
    tenantId: string,
  ): Promise<string> {
    const hashedPassword = await this.bcryptService.hashPassword(userDto.password);

    const user = User.create({
      email: userDto.email,
      passwordHash: hashedPassword,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      tenantId,
    });

    user.assignRole({ roleId, userId: user.id });

    return this.usersApi.create(user);
  }
}
