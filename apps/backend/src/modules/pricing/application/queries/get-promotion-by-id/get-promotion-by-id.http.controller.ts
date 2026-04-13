import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetPromotionByIdQuery } from './get-promotion-by-id.query';
import { GetPromotionByIdResponseDto } from './get-promotion-by-id.response.dto';

@StaffRoute(Permission.VIEW_PRICING)
@Controller('pricing/promotions')
export class GetPromotionByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GetPromotionByIdResponseDto> {
    const result = await this.queryBus.execute(new GetPromotionByIdQuery(user.tenantId, id));

    if (!result) {
      throw new NotFoundException('Promotion not found');
    }

    return result;
  }
}
