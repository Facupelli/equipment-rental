import { ConflictException, Controller, Delete, HttpCode, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { PricingRuleHasCouponsError, PricingRuleNotFoundError } from '../../../domain/errors/pricing.errors';

import { DeletePricingRuleCommand } from './delete-pricing-rule.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/rules')
export class DeletePricingRuleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeletePricingRuleCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof PricingRuleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof PricingRuleHasCouponsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
