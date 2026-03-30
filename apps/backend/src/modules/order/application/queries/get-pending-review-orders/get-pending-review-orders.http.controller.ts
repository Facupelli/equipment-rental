import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { UserOnlyGuard } from 'src/modules/auth/infrastructure/guards/user-only.guard';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetPendingReviewOrdersQuery } from './get-pending-review-orders.query';
import { GetPendingReviewOrdersRequestDto } from './get-pending-review-orders.request.dto';
import { GetPendingReviewOrdersResponseDto } from './get-pending-review-orders.response.dto';

@UseGuards(UserOnlyGuard)
@Controller('orders/pending-review')
export class GetPendingReviewOrdersHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  async getPendingReviewOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetPendingReviewOrdersRequestDto,
  ): Promise<GetPendingReviewOrdersResponseDto> {
    return this.queryBus.execute(new GetPendingReviewOrdersQuery(user.tenantId, dto.page, dto.limit, dto.locationId));
  }
}
