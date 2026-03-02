import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTenantUserDto, RegisterResponseDto } from '@repo/schemas';
import { UsersService } from 'src/modules/users/application/users.service';
import { RolesService } from 'src/modules/users/application/roles.service';
import { TenancyRepositoryPort } from '../domain/ports/tenancy.repository.port';
import { Tenant } from '../domain/entities/tenant.entity';

@Injectable()
export class CreateTenantUserUseCase {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly tenancyRepository: TenancyRepositoryPort,
  ) {}

  async execute(dto: CreateTenantUserDto): Promise<RegisterResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // TODO: implement orchestration in a transaction
    const tenantId = await this.createTenant({
      companyName: dto.companyName,
    });

    const roleId = await this.rolesService.create({
      tenantId,
      name: 'Admin',
      description: 'Default administrator role',
    });

    const userId = await this.usersService.create({
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
