import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetBundlesQuery } from './get-bundles.query';
import { GetBundlesRequestDto } from './get-bundles.request.dto';
import { GetBundlesResponseDto } from './get-bundles.response.dto';

@StaffRoute(Permission.VIEW_BUNDLES)
@Controller('bundles')
export class GetBundlesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  async getBundles(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetBundlesRequestDto,
  ): Promise<GetBundlesResponseDto> {
    return await this.queryBus.execute(new GetBundlesQuery(user.tenantId, dto.page, dto.limit, dto.name));
  }
}
