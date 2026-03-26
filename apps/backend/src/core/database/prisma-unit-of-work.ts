import { Injectable } from '@nestjs/common';

import { RoleRepository } from 'src/modules/users/infrastructure/persistence/repositories/role.repository';
import { UserRepository } from 'src/modules/users/infrastructure/persistence/repositories/user.repository';
import { TenantRepository } from 'src/modules/tenant/infrastructure/persistence/repositories/tenant.repository';

import { PrismaService } from './prisma.service';

export interface RegisterTenantUnitOfWorkContext {
  tenantRepository: TenantRepository;
  roleRepository: RoleRepository;
  userRepository: UserRepository;
}

@Injectable()
export class PrismaUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(work: (context: RegisterTenantUnitOfWorkContext) => Promise<T>): Promise<T> {
    return this.prisma.client.$transaction(async (tx) => {
      return work({
        tenantRepository: new TenantRepository(tx as any),
        roleRepository: new RoleRepository(tx as any),
        userRepository: new UserRepository(tx as any),
      });
    });
  }
}
