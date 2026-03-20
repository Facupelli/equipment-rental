import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreatePricingRuleCommand } from '../../application/commands/create-pricing-rule/create-pricing-rule.command';
import { CreatePricingRuleDto } from '@repo/schemas';

@Controller('pricing/rules')
export class PricingRulesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPricingRule(@CurrentUser() user: ReqUser, @Body() dto: CreatePricingRuleDto): Promise<{ id: string }> {
    const id: string = await this.commandBus.execute(
      new CreatePricingRuleCommand(
        user.tenantId,
        dto.name,
        dto.type,
        dto.scope,
        dto.priority,
        dto.stackable,
        dto.condition,
        dto.effect,
      ),
    );

    return { id };
  }
}
