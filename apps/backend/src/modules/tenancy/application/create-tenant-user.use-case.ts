import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTenantUserDto, RegisterResponseDto } from '@repo/schemas';
import { TenancyRepositoryPort } from '../domain/ports/tenancy.repository.port';
import { Tenant } from '../domain/entities/tenant.entity';
import { UserQueryPort } from 'src/modules/users/application/ports/user-query.port';
import { UserCommandPort } from 'src/modules/users/application/ports/user-command.port';
import { RoleCommandPort } from 'src/modules/users/application/ports/role-command.port';

@Injectable()
export class CreateTenantUserUseCase {
  constructor(
    private readonly usersQuery: UserQueryPort,
    private readonly usersCommand: UserCommandPort,
    private readonly rolesCommand: RoleCommandPort,
    private readonly tenancyRepository: TenancyRepositoryPort,
  ) {}

  async execute(dto: CreateTenantUserDto): Promise<RegisterResponseDto> {
    const isEmailTaken = await this.usersQuery.isEmailTaken(dto.email);
    if (isEmailTaken) {
      throw new ConflictException('Email already in use');
    }

    // TODO: implement orchestration in a transaction
    const tenantId = await this.createTenant({
      companyName: dto.companyName,
    });

    const roleId = await this.rolesCommand.create({
      tenantId,
      name: 'Admin',
      description: 'Default administrator role',
    });

    const userId = await this.usersCommand.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      tenantId,
      roleId,
    });

    return { userId, tenantId };
  }

  private async createTenant({ companyName }: { companyName: string }): Promise<string> {
    const companySlug = companyName.toLowerCase().replaceAll(' ', '-');

    const isSlugTaken = await this.tenancyRepository.isSlugTaken(companySlug);
    if (isSlugTaken) {
      throw new ConflictException('Company name already in use');
    }

    const tenant = Tenant.create({
      name: companyName,
      slug: companySlug,
      planTier: 'free',
    });

    const tenantId = await this.tenancyRepository.save(tenant);
    return tenantId;
  }
}
