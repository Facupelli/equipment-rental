import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, NotFoundException, Patch } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { TenantNotFoundError } from 'src/modules/tenant/domain/errors/tenant.errors';
import { UpdateTenantBrandingCommand } from './update-branding.command';
import { UpdateTenantBrandingDto } from './update-branding.request.dto';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('tenants')
export class UpdateTenantBrandingHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch('branding')
  async updateBranding(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTenantBrandingDto): Promise<void> {
    const result = await this.commandBus.execute(new UpdateTenantBrandingCommand(user.tenantId, dto.logoUrl));

    if (result.isErr()) {
      if (result.error instanceof TenantNotFoundError) {
        throw new NotFoundException(result.error.message);
      }

      throw result.error;
    }
  }
}
