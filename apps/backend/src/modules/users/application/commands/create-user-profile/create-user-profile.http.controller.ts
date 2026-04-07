import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffOnly } from 'src/core/decorators/staff-only.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  UserIsNotTenantAdminError,
  UserNotFoundError,
  UserProfileAlreadyExistsError,
} from 'src/modules/users/domain/errors/users.errors';

import { CreateUserProfileCommand } from './create-user-profile.command';
import { CreateUserProfileRequestDto } from './create-user-profile.request.dto';
import { CreateUserProfileResponseDto } from './create-user-profile.response.dto';

@StaffOnly()
@Controller('users')
export class CreateUserProfileHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':userId/profile')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: CreateUserProfileRequestDto,
  ): Promise<CreateUserProfileResponseDto> {
    const result = await this.commandBus.execute(
      new CreateUserProfileCommand({
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

      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UserProfileAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof UserIsNotTenantAdminError) {
        throw new ForbiddenException(error.message);
      }

      throw error;
    }

    return {
      id: result.value.id,
    } satisfies CreateUserProfileResponseDto;
  }
}
