import { Permission } from '@repo/types';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetPendingCustomerProfilesQuery } from './get-pending-customer-profiles.query';
import { GetPendingCustomerProfilesResponseDto } from './get-pending-customer-profiles.response.dto';
import { GetPendingCustomerProfilesResult } from './get-pending-customer-profiles.read-model';

@StaffRoute(Permission.VIEW_CUSTOMERS)
@Controller('customer-profiles/pending')
export class GetPendingCustomerProfilesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPendingCustomerProfiles(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GetPendingCustomerProfilesResponseDto> {
    const result: GetPendingCustomerProfilesResult = await this.queryBus.execute(
      new GetPendingCustomerProfilesQuery(user.tenantId),
    );

    return result.map((profile) => ({
      id: profile.id,
      customerName: profile.customerName,
      submittedAt: profile.submittedAt,
      status: profile.status,
    }));
  }
}
