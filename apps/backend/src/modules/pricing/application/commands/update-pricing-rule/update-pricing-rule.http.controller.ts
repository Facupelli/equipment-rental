import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Param, Put } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { PricingRuleNotFoundError } from '../../../domain/errors/pricing.errors';

import { UpdatePricingRuleCommand } from './update-pricing-rule.command';
import { UpdatePricingRuleRequestDto } from './update-pricing-rule.request.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/rules')
export class UpdatePricingRuleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdatePricingRuleCommand(
        user.tenantId,
        id,
        dto.name,
        dto.type,
        dto.scope,
        dto.priority,
        dto.stackable,
        dto.condition,
        dto.effect,
      ),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof PricingRuleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
