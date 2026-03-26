import { CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import { BcryptService } from 'src/modules/auth/application/bcript.service';
import { PrismaUnitOfWork } from 'src/core/database/prisma-unit-of-work';
import { Result, err, ok } from 'src/core/result';
import { IsEmailTakenQuery } from 'src/modules/users/application/queries/is-email-taken/is-email-taken.query';
import { Role } from 'src/modules/users/domain/entities/role.entity';
import { TENANT_ADMIN_PERMISSIONS } from 'src/modules/users/domain/tenant-admin.permissions';
import { TENANT_ADMIN_ROLE_CODE, TENANT_ADMIN_ROLE_NAME } from 'src/modules/users/domain/role.constants';
import { User } from 'src/modules/users/domain/entities/user.entity';

import { Tenant } from '../../../domain/entities/tenant.entity';
import { TenantRegisteredEvent } from '../../../domain/events/tenant-registered.event';
import { TenantSlugService } from '../../../domain/services/tenant-slug.service';
import { IsSlugTakenQuery } from '../../queries/is-slug-taken/is-slug-taken.query';
import { CompanyNameAlreadyInUseError, EmailAlreadyInUseError, RegisterTenantError } from './register-tenant.errors';
import { RegisterTenantCommand } from './register-tenant.command';

export interface RegisterTenantResponse {
  userId: string;
  tenantId: string;
}

@CommandHandler(RegisterTenantCommand)
export class RegisterTenantService implements ICommandHandler<RegisterTenantCommand> {
  constructor(
    private readonly unitOfWork: PrismaUnitOfWork,
    private readonly queryBus: QueryBus,
    private readonly bcryptService: BcryptService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterTenantCommand): Promise<Result<RegisterTenantResponse, RegisterTenantError>> {
    const { user, tenant } = command;

    const isEmailTaken = await this.queryBus.execute<IsEmailTakenQuery, boolean>(new IsEmailTakenQuery(user.email));
    if (isEmailTaken) {
      return err(new EmailAlreadyInUseError());
    }

    const slug = TenantSlugService.createFromName(tenant.name);
    const isSlugTaken = await this.queryBus.execute<IsSlugTakenQuery, boolean>(new IsSlugTakenQuery(slug));
    if (isSlugTaken) {
      return err(new CompanyNameAlreadyInUseError());
    }

    const passwordHash = await this.bcryptService.hashPassword(user.password);

    const created = await this.unitOfWork.runInTransaction(
      async ({ tenantRepository, roleRepository, userRepository }) => {
        const createdTenant = Tenant.create({
          name: tenant.name,
          slug,
        });
        await tenantRepository.save(createdTenant);

        const adminRole = Role.create({
          tenantId: createdTenant.id,
          code: TENANT_ADMIN_ROLE_CODE,
          name: TENANT_ADMIN_ROLE_NAME,
          description: 'Tenant administrator role',
        });

        for (const permission of TENANT_ADMIN_PERMISSIONS) {
          adminRole.addPermission(permission);
        }

        await roleRepository.save(adminRole);

        const adminUser = User.create({
          tenantId: createdTenant.id,
          email: user.email,
          passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
        });
        adminUser.assignRole({ userId: adminUser.id, roleId: adminRole.id });
        await userRepository.save(adminUser);

        return {
          tenantId: createdTenant.id,
          userId: adminUser.id,
          slug: createdTenant.slug,
          adminEmail: adminUser.email,
        };
      },
    );

    this.eventBus.publish(
      new TenantRegisteredEvent(created.tenantId, created.userId, created.adminEmail, created.slug),
    );

    return ok({ userId: created.userId, tenantId: created.tenantId });
  }
}
