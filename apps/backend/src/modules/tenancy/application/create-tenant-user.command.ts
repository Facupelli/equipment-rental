import { ConflictException, Injectable } from '@nestjs/common';
import { createTenantUserDto, RegisterResponseDto } from '@repo/schemas';
import { UsersService } from 'src/modules/users/application/users.service';
import { RolesService } from 'src/modules/users/application/roles.service';
import { TenancyService } from './tenancy.service';

@Injectable()
export class CreateTenantUserCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly tenancyService: TenancyService,
  ) {}

  async execute(dto: createTenantUserDto): Promise<RegisterResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const tenantId = await this.tenancyService.create(dto);

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
}
