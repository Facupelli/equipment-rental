import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { TENANT_ADMIN_ROLE_CODE } from 'src/modules/users/domain/role.constants';
import {
  UserIsNotTenantAdminError,
  UserNotFoundError,
  UserProfileNotFoundError,
} from 'src/modules/users/domain/errors/users.errors';
import { UserProfileRepository } from 'src/modules/users/infrastructure/persistence/repositories/user-profile.repository';

import { UpdateUserProfileCommand } from './update-user-profile.command';

type UpdateUserProfileResult = Result<void, UserNotFoundError | UserProfileNotFoundError | UserIsNotTenantAdminError>;

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileService implements ICommandHandler<UpdateUserProfileCommand, UpdateUserProfileResult> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<UpdateUserProfileResult> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        id: command.userId,
        tenantId: command.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return err(new UserNotFoundError(command.userId, command.tenantId));
    }

    const tenantAdminUser = await this.prisma.client.user.findFirst({
      where: {
        id: command.userId,
        tenantId: command.tenantId,
        deletedAt: null,
        userRoles: {
          some: {
            role: {
              code: TENANT_ADMIN_ROLE_CODE,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!tenantAdminUser) {
      return err(new UserIsNotTenantAdminError(command.userId, command.tenantId));
    }

    const profile = await this.userProfileRepository.findByUserId(command.userId);
    if (!profile) {
      return err(new UserProfileNotFoundError(command.userId));
    }

    profile.update({
      fullName: command.fullName,
      documentNumber: command.documentNumber,
      phone: command.phone,
      address: command.address,
      signUrl: command.signUrl,
    });

    await this.userProfileRepository.save(profile);

    return ok(undefined);
  }
}
