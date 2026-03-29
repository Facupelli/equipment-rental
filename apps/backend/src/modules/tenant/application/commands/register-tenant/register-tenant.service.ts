import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';

import { PrismaUnitOfWork } from 'src/core/database/prisma-unit-of-work';
import { Result, err, ok } from 'neverthrow';
import { UsersPublicApi } from 'src/modules/users/users.public-api';
import { TenantRepository } from 'src/modules/tenant/infrastructure/persistence/repositories/tenant.repository';

import { Tenant } from '../../../domain/entities/tenant.entity';
import { CompanyNameAlreadyInUseError, EmailAlreadyInUseError } from '../../../domain/errors/tenant.errors';
import { TenantSlugService } from '../../../domain/services/tenant-slug.service';
import { IsSlugTakenQuery } from '../../queries/is-slug-taken/is-slug-taken.query';
import { RegisterTenantCommand } from './register-tenant.command';

export interface RegisterTenantResponse {
  userId: string;
  tenantId: string;
}

type RegisterTenantError = EmailAlreadyInUseError | CompanyNameAlreadyInUseError;

@CommandHandler(RegisterTenantCommand)
export class RegisterTenantService implements ICommandHandler<RegisterTenantCommand> {
  constructor(
    private readonly unitOfWork: PrismaUnitOfWork,
    private readonly queryBus: QueryBus,
    private readonly usersApi: UsersPublicApi,
  ) {}

  async execute(command: RegisterTenantCommand): Promise<Result<RegisterTenantResponse, RegisterTenantError>> {
    const { user, tenant } = command;

    const isEmailTaken = await this.usersApi.isEmailTaken(user.email);
    if (isEmailTaken) {
      return err(new EmailAlreadyInUseError());
    }

    const slug = TenantSlugService.createFromName(tenant.name);
    const isSlugTaken = await this.queryBus.execute<IsSlugTakenQuery, boolean>(new IsSlugTakenQuery(slug));
    if (isSlugTaken) {
      return err(new CompanyNameAlreadyInUseError());
    }

    const passwordHash = await bcrypt.hash(user.password, 10);

    const created = await this.unitOfWork.runInTransaction(async ({ tx, events }) => {
      const tenantRepository = new TenantRepository(tx);

      const createdTenant = Tenant.create({
        name: tenant.name,
        slug,
      });
      await tenantRepository.save(createdTenant);
      events.collectFrom(createdTenant);

      const admin = await this.usersApi.bootstrapTenantAdmin(tx, {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: createdTenant.id,
      });

      return {
        tenantId: createdTenant.id,
        userId: admin.userId,
      };
    });

    return ok({ userId: created.userId, tenantId: created.tenantId });
  }
}
