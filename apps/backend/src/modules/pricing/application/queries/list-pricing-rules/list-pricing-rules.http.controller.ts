import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { ListPricingRulesQuery } from './list-pricing-rules.query';
import { ListPricingRulesRequestDto } from './list-pricing-rules.request.dto';
import { ListPricingRulesResponseDto } from './list-pricing-rules.response.dto';

@StaffRoute(Permission.VIEW_PRICING)
@Controller('pricing/rules')
export class ListPricingRulesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  @HttpCode(HttpStatus.OK)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPricingRulesRequestDto,
  ): Promise<ListPricingRulesResponseDto> {
    const response: ListPricingRulesResponseDto = await this.queryBus.execute(
      new ListPricingRulesQuery(user.tenantId, query.page, query.limit, query.search, query.type),
    );

    return response;
  }
}
