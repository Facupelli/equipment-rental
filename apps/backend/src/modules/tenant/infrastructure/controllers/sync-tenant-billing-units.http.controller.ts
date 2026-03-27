import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Result } from 'src/core/result';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { SyncTenantBillingUnitsCommand } from '../../application/commands/sync-billing-units/sync-tenant-billing-units.command';
import { SyncTenantBillingUnitsDto } from '../../application/commands/sync-billing-units/sync-tenant-billing-units.request.dto';

@Controller('tenants')
export class SyncTenantBillingUnitsHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('billing-units')
  async sync(@CurrentUser() user: ReqUser, @Body() dto: SyncTenantBillingUnitsDto): Promise<void> {
    const result = await this.commandBus.execute<SyncTenantBillingUnitsCommand, Result<void, void>>(
      new SyncTenantBillingUnitsCommand(user.tenantId, dto.billingUnitIds),
    );

    if (result.isErr()) {
      throw result.error;
    }
  }
}
