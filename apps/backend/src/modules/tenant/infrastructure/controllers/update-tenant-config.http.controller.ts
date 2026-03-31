import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, NotFoundException, Patch } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { UpdateTenantConfigCommand } from '../../application/commands/update-config/update-config.command';
import { UpdateTenantConfigDto } from '../../application/commands/update-config/update-config.request.dto';
import { TenantNotFoundError } from '../../domain/errors/tenant.errors';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('tenants')
export class UpdateTenantConfigHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch('config')
  async updateConfig(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTenantConfigDto): Promise<void> {
    const result = await this.commandBus.execute(new UpdateTenantConfigCommand(user.tenantId, dto));

    if (result.isErr()) {
      if (result.error instanceof TenantNotFoundError) {
        throw new NotFoundException(result.error.message);
      }

      throw result.error;
    }
  }
}
