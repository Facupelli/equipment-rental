import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffOnly } from 'src/core/decorators/staff-only.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  UserIsNotTenantAdminError,
  UserNotFoundError,
  UserProfileNotFoundError,
} from 'src/modules/users/domain/errors/users.errors';

import { UpdateUserProfileCommand } from './update-user-profile.command';
import { UpdateUserProfileRequestDto } from './update-user-profile.request.dto';

@StaffOnly()
@Controller('users')
export class UpdateUserProfileHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':userId/profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserProfileRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdateUserProfileCommand({
        tenantId: user.tenantId,
        userId,
        fullName: dto.fullName,
        documentNumber: dto.documentNumber,
        phone: dto.phone,
        address: dto.address,
        signUrl: dto.signUrl,
      }),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof UserNotFoundError || error instanceof UserProfileNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UserIsNotTenantAdminError) {
        throw new ForbiddenException(error.message);
      }

      throw error;
    }
  }
}
