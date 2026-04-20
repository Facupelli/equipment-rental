import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';

import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';

import { GetProductTimelineQuery } from './get-product-timeline.query';
import { GetProductTimelineRequestDto } from './get-product-timeline.request.dto';
import { GetProductTimelineResponseDto } from './get-product-timeline.response.dto';

@StaffRoute(Permission.VIEW_ASSETS)
@Controller('inventory/product-timeline')
export class GetProductTimelineHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getTimeline(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetProductTimelineRequestDto,
  ): Promise<GetProductTimelineResponseDto> {
    const result = await this.queryBus.execute(
      new GetProductTimelineQuery(user.tenantId, dto.productTypeId, dto.locationId, dto.from, dto.to),
    );

    if (!result) {
      throw new NotFoundException('Product timeline context not found');
    }

    return result;
  }
}
