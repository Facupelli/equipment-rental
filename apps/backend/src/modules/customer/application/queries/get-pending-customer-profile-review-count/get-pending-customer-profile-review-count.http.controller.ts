import { Permission } from '@repo/types';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetPendingCustomerProfileReviewCountQuery } from './get-pending-customer-profile-review-count.query';
import { GetPendingCustomerProfileReviewCountResponseDto } from './get-pending-customer-profile-review-count.response.dto';
import { GetPendingCustomerProfileReviewCountResult } from './get-pending-customer-profile-review-count.read-model';

@StaffRoute(Permission.VIEW_CUSTOMERS)
@Controller('customer-profiles/pending/count')
export class GetPendingCustomerProfileReviewCountHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPendingCustomerProfileReviewCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GetPendingCustomerProfileReviewCountResponseDto> {
    const result: GetPendingCustomerProfileReviewCountResult = await this.queryBus.execute(
      new GetPendingCustomerProfileReviewCountQuery(user.tenantId),
    );

    return {
      count: result.count,
    };
  }
}
