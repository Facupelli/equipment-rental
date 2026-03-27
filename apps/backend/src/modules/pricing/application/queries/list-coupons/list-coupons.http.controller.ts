import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { ListCouponsQuery } from './list-coupons.query';
import { ListCouponsRequestDto } from './list-coupons.request.dto';
import { ListCouponsResponseDto } from './list-coupons.response.dto';

@Controller('pricing/coupons')
export class ListCouponsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  @HttpCode(HttpStatus.OK)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCouponsRequestDto,
  ): Promise<ListCouponsResponseDto> {
    const response: ListCouponsResponseDto = await this.queryBus.execute(
      new ListCouponsQuery(user.tenantId, query.page, query.limit, query.search),
    );

    return response;
  }
}
