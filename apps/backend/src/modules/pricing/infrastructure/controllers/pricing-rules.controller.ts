import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreatePricingRuleCommand } from '../../application/commands/create-pricing-rule/create-pricing-rule.command';
import { CreatePricingRuleDto, PaginatedDto, PricingRuleView } from '@repo/schemas';
import { ListPricingRulesQuery } from '../../presentation/queries/list-pricing-rules/list-pricing-rules.query';
import { ListPricingRulesQueryDto } from '../../application/dto/list-pricing-rules-query.dto';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';

@Controller('pricing/rules')
export class PricingRulesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @Get()
  @Paginated()
  @HttpCode(HttpStatus.OK)
  async listPricingRules(
    @CurrentUser() user: ReqUser,
    @Query() query: ListPricingRulesQueryDto,
  ): Promise<PaginatedDto<PricingRuleView>> {
    return this.queryBus.execute(new ListPricingRulesQuery(user.tenantId, query.page, query.limit, query.search));
  }
}
