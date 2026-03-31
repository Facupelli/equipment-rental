import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetCustomerDetailQuery } from './get-customer-detail.query';
import { GetCustomerDetailResponseDto } from './get-customer-detail.response.dto';
import { GetCustomerDetailResult } from './get-customer-detail.read-model';

@StaffRoute(Permission.VIEW_CUSTOMERS)
@Controller('customers')
export class GetCustomerDetailHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getCustomerDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<GetCustomerDetailResponseDto> {
    const customer: GetCustomerDetailResult | null = await this.queryBus.execute(
      new GetCustomerDetailQuery(user.tenantId, id),
    );

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isCompany: customer.isCompany,
      companyName: customer.companyName,
      isActive: customer.isActive,
      onboardingStatus: customer.onboardingStatus,
      createdAt: customer.createdAt,
      totalOrders: customer.totalOrders,
      activeRentals: customer.activeRentals.map((rental) => ({
        orderId: rental.orderId,
        orderNumber: rental.orderNumber,
        returnDate: rental.returnDate,
      })),
    };
  }
}
