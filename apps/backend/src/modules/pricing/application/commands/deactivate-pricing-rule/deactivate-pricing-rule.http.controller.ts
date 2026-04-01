import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { PricingRuleNotFoundError } from '../../../domain/errors/pricing.errors';

import { DeactivatePricingRuleCommand } from './deactivate-pricing-rule.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/rules')
export class DeactivatePricingRuleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeactivatePricingRuleCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof PricingRuleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
