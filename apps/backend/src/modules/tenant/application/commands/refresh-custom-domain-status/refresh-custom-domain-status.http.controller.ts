import { Controller, NotFoundException, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CustomDomainNotFoundError } from 'src/modules/tenant/domain/errors/tenant.errors';

import { CustomDomainResponseDto } from '../../custom-domain.response.dto';
import { RefreshCustomDomainStatusCommand } from './refresh-custom-domain-status.command';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('tenants')
export class RefreshCustomDomainStatusHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('custom-domain/refresh')
  async refresh(@CurrentUser() user: AuthenticatedUser): Promise<CustomDomainResponseDto> {
    const result = await this.commandBus.execute(new RefreshCustomDomainStatusCommand(user.tenantId));

    if (result.isErr()) {
      if (result.error instanceof CustomDomainNotFoundError) {
        throw new NotFoundException(result.error.message);
      }

      throw result.error;
    }

    return {
      domain: result.value.domain,
      status: result.value.status,
      verifiedAt: result.value.verifiedAt ? result.value.verifiedAt.toISOString() : null,
      lastError: result.value.lastError,
    };
  }
}
