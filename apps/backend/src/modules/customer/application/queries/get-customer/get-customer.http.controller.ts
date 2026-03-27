import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { CustomerOnlyGuard } from 'src/modules/auth/infrastructure/guards/customer-only.guard';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetCustomerQuery } from './get-customer.query';
import { GetCustomerResponseDto } from './get-customer.response.dto';
import { GetCustomerResult } from './get-customer.read-model';

@UseGuards(CustomerOnlyGuard)
@Controller('customers')
export class GetCustomerHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  async getCustomer(@CurrentUser() user: AuthenticatedUser): Promise<GetCustomerResponseDto | null> {
    const customer: GetCustomerResult | null = await this.queryBus.execute(new GetCustomerQuery(user.id));

    if (!customer) {
      return null;
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: customer.fullName,
      isActive: customer.isActive,
      isCompany: customer.isCompany,
      companyName: customer.companyName,
      tenantId: customer.tenantId,
      onboardingStatus: customer.onboardingStatus,
    };
  }
}
