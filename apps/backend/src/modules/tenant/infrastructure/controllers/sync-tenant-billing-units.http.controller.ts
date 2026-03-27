import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Result } from 'src/core/result';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { SyncTenantBillingUnitsCommand } from '../../application/commands/sync-billing-units/sync-tenant-billing-units.command';
import { SyncTenantBillingUnitsDto } from '../../application/commands/sync-billing-units/sync-tenant-billing-units.request.dto';

@Controller('tenants')
export class SyncTenantBillingUnitsHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('billing-units')
  async sync(@CurrentUser() user: AuthenticatedUser, @Body() dto: SyncTenantBillingUnitsDto): Promise<void> {
    const result = await this.commandBus.execute<SyncTenantBillingUnitsCommand, Result<void, void>>(
      new SyncTenantBillingUnitsCommand(user.tenantId, dto.billingUnitIds),
    );

    if (result.isErr()) {
      throw result.error;
    }
  }
}
