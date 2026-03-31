import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CreatePricingRuleCommand } from './create-pricing-rule.command';
import { CreatePricingRuleRequestDto } from './create-pricing-rule.request.dto';
import { CreatePricingRuleResponseDto } from './create-pricing-rule.response.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/rules')
export class CreatePricingRuleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePricingRuleRequestDto,
  ): Promise<CreatePricingRuleResponseDto> {
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

    const response: CreatePricingRuleResponseDto = { id };
    return response;
  }
}
