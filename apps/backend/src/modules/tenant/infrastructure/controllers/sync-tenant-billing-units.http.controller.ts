import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { SyncTenantBillingUnitsCommand } from '../../application/commands/sync-billing-units/sync-tenant-billing-units.command';
import { SyncTenantBillingUnitsDto } from '../../application/commands/sync-billing-units/sync-tenant-billing-units.request.dto';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('tenants')
export class SyncTenantBillingUnitsHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('billing-units')
  async sync(@CurrentUser() user: AuthenticatedUser, @Body() dto: SyncTenantBillingUnitsDto): Promise<void> {
    await this.commandBus.execute<SyncTenantBillingUnitsCommand, void>(
      new SyncTenantBillingUnitsCommand(user.tenantId, dto.billingUnitIds),
    );
  }
}
