import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTenantUserDto, RegisterResponseDto } from '@repo/schemas';
import { Tenant } from '../domain/entities/tenant.entity';
import { TenantReadService, TenantRepositoryPort } from '../domain/ports/tenant.repository.port';
import { UsersPublicApi } from 'src/modules/users/application/users-public-api';
import { Role } from 'src/modules/users/domain/entities/role.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { BcryptService } from 'src/modules/auth/application/bcript.service';

@Injectable()
export class CreateTenantUserUseCase {
  constructor(
    private readonly tenancyRepository: TenantRepositoryPort,
    private readonly bccryptService: BcryptService,
    private readonly tenantService: TenantReadService,
    private readonly usersApi: UsersPublicApi,
  ) {}

  async execute(dto: CreateTenantUserDto): Promise<RegisterResponseDto> {
    const isEmailTaken = await this.usersApi.isEmailTaken(dto.email);
    if (isEmailTaken) {
      throw new ConflictException('Email already in use');
    }

    // TODO: implement orchestration in a transaction
    const tenantId = await this.createTenant(dto.companyName);
    const roleId = await this.createRole(tenantId);
    const userId = await this.createUserAndAssignRole(dto, roleId, tenantId);

    return { userId, tenantId };
  }

  private async createTenant(companyName: string): Promise<string> {
    const companySlug = companyName.toLowerCase().replaceAll(' ', '-');

    const isSlugTaken = await this.tenantService.isSlugTaken(companySlug);
    if (isSlugTaken) {
      throw new ConflictException('Company name already in use');
    }

    const tenant = Tenant.create({
      name: companyName,
      slug: companySlug,
    });

    const tenantId = await this.tenancyRepository.save(tenant);
    return tenantId;
  }

  private async createRole(tenantId: string): Promise<string> {
    const role = Role.create({
      name: 'Admin',
      description: 'Default administrator role',
      tenantId,
    });
    const roleId = await this.usersApi.createRole(role);

    return roleId;
  }

  private async createUserAndAssignRole(dto: CreateTenantUserDto, roleId: string, tenantId: string): Promise<string> {
    const hashedPassword = await this.bccryptService.hashPassword(dto.password);

    const user = User.create({
      email: dto.email,
      passwordHash: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      tenantId,
    });

    user.assignRole({
      roleId,
      userId: user.id,
    });

    const userId = await this.usersApi.create(user);
    return userId;
  }
}
