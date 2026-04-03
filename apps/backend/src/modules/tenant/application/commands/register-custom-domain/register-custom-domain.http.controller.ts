import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  CustomDomainAlreadyInUseError,
  InvalidCustomDomainError,
  TenantAlreadyHasCustomDomainError,
  TenantNotFoundError,
  UnsupportedApexCustomDomainError,
} from 'src/modules/tenant/domain/errors/tenant.errors';

import { RegisterCustomDomainCommand } from './register-custom-domain.command';
import { RegisterCustomDomainRequestDto } from './register-custom-domain.request.dto';
import { RegisterCustomDomainResponseDto } from './register-custom-domain.response.dto';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('tenants')
export class RegisterCustomDomainHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('custom-domain')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterCustomDomainRequestDto,
  ): Promise<RegisterCustomDomainResponseDto> {
    const result = await this.commandBus.execute(new RegisterCustomDomainCommand(user.tenantId, dto.domain));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof InvalidCustomDomainError || error instanceof UnsupportedApexCustomDomainError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof CustomDomainAlreadyInUseError || error instanceof TenantAlreadyHasCustomDomainError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof TenantNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

    return result.value;
  }
}
