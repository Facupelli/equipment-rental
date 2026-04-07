import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { TENANT_ADMIN_ROLE_CODE } from 'src/modules/users/domain/role.constants';
import {
  UserIsNotTenantAdminError,
  UserNotFoundError,
  UserProfileAlreadyExistsError,
} from 'src/modules/users/domain/errors/users.errors';
import { UserProfile } from 'src/modules/users/domain/entities/user-profile.entity';
import { UserProfileRepository } from 'src/modules/users/infrastructure/persistence/repositories/user-profile.repository';

import { CreateUserProfileCommand } from './create-user-profile.command';

type CreateUserProfileResult = Result<
  { id: string },
  UserNotFoundError | UserProfileAlreadyExistsError | UserIsNotTenantAdminError
>;

@CommandHandler(CreateUserProfileCommand)
export class CreateUserProfileService implements ICommandHandler<CreateUserProfileCommand, CreateUserProfileResult> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(command: CreateUserProfileCommand): Promise<CreateUserProfileResult> {
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

    const existingProfile = await this.userProfileRepository.findByUserId(command.userId);
    if (existingProfile) {
      return err(new UserProfileAlreadyExistsError(command.userId));
    }

    const profile = UserProfile.create({
      userId: command.userId,
      fullName: command.fullName,
      documentNumber: command.documentNumber,
      phone: command.phone,
      address: command.address,
      signUrl: command.signUrl,
    });

    await this.userProfileRepository.save(profile);

    return ok({ id: profile.id });
  }
}
