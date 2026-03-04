import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepositoryPort } from '../../domain/ports/tenant.repository.port';
import { UsersPublicApi } from '../../../users/application/users-public-api';
import { BcryptService } from '../../../auth/application/bcript.service';
import { CreateTenantUserCommand } from './create-tenant-user.command';
import { EmailAlreadyInUseError, CompanyNameAlreadyInUseError, TenantUserError } from '../errors/tenant-user.errors';
import { Result, ok, err } from '../../../../core/result';
import { IsSlugTakenQuery } from '../queries/is-slug-taken.query';
import { CreateTenantUserDto } from '../dto/create-tenant-user.dto';
import { IsEmailTakenQuery } from 'src/modules/users/application/queries/is-email-taken/is-email-taken.query';

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

    const isEmailTaken = await this.queryBus.execute<IsEmailTakenQuery, boolean>(new IsEmailTakenQuery(user.email));
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
    const roleId = await this.usersApi.createRole({
      name: 'Admin',
      description: 'Default administrator role',
      tenantId,
    });

    return roleId;
  }

  private async createUserAndAssignRole(
    userDto: CreateTenantUserDto['user'],
    roleId: string,
    tenantId: string,
  ): Promise<string> {
    const passwordHash = await this.bcryptService.hashPassword(userDto.password);

    const userId = await this.usersApi.create({
      ...userDto,
      passwordHash,
      tenantId,
      roleId,
    });

    return userId;
  }
}
