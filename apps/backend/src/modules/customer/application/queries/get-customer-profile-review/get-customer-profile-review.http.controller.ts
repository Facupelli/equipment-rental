import { Permission } from '@repo/types';
import { Controller, Get, HttpCode, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetCustomerProfileReviewQuery } from './get-customer-profile-review.query';
import { GetCustomerProfileReviewResponseDto } from './get-customer-profile-review.response.dto';
import { GetCustomerProfileReviewResult } from './get-customer-profile-review.read-model';

@StaffRoute(Permission.VIEW_CUSTOMERS)
@Controller('customer-profiles')
export class GetCustomerProfileReviewHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCustomerProfileReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<GetCustomerProfileReviewResponseDto> {
    const profile: GetCustomerProfileReviewResult | null = await this.queryBus.execute(
      new GetCustomerProfileReviewQuery(user.tenantId, id),
    );

    if (!profile) {
      throw new NotFoundException(`Customer profile ${id} not found`);
    }

    return profile;
  }
}
