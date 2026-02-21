import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterTenantAndAdminDto, RegisterResponseDto } from '@repo/schemas';
import * as bcrypt from 'bcrypt';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { randomUUID } from 'node:crypto';
import { Tenant } from '../domain/entities/tenant.entity';
import { UsersService } from 'src/modules/users/services/users.service';
import { RolesService } from 'src/modules/users/services/roles.service';
import { Role } from 'src/modules/users/domain/entities/role.entity';
import { TenancyRepository } from '../domain/repositories/tenancy.repository';

@Injectable()
export class RegisterTenantAndAdminUseCase {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly tenancyRepository: TenancyRepository,
  ) {}

  async execute(dto: RegisterTenantAndAdminDto): Promise<RegisterResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const slugTaken = await this.tenancyRepository.findBySlug(dto.companySlug);
    if (slugTaken) {
      throw new ConflictException('Company slug already in use');
    }

    const tenant = Tenant.create(randomUUID(), dto.companyName, dto.companySlug, 'starter');
    const tenantId = await this.tenancyRepository.save(tenant);

    const adminRole = Role.create(randomUUID(), tenantId, 'Admin', 'Default administrator role');
    const roleId = await this.rolesService.save(adminRole);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = User.create(randomUUID(), dto.email, passwordHash, dto.firstName, dto.lastName, tenantId, roleId);

    const userId = await this.usersService.save(user);

    return { userId, tenantId };
  }
}
