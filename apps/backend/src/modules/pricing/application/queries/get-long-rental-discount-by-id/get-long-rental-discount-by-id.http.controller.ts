import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetLongRentalDiscountByIdQuery } from './get-long-rental-discount-by-id.query';
import { GetLongRentalDiscountByIdResponseDto } from './get-long-rental-discount-by-id.response.dto';

@StaffRoute(Permission.VIEW_PRICING)
@Controller('pricing/long-rental-discounts')
export class GetLongRentalDiscountByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<GetLongRentalDiscountByIdResponseDto> {
    const result = await this.queryBus.execute(new GetLongRentalDiscountByIdQuery(user.tenantId, id));

    if (!result) {
      throw new NotFoundException('Long rental discount not found');
    }

    return result;
  }
}
