import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCustomersQuery } from '../../application/queries/get-customers/get-customers.query';
import { GetCustomersQueryDto } from '../../application/dto/get-customers-query.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { GetCustomerDetailQuery } from '../../application/queries/get-customer-detail/get-customer-detail.query';
import { CustomerDetailResponseDto, MeCustomerResponseDto } from '@repo/schemas';
import { GetCustomerQuery } from '../../application/queries/get-customer/get-customer.query';

@Controller('customers')
export class CustomerController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  async getCustomers(@CurrentUser() user: ReqUser, @Query() dto: GetCustomersQueryDto): Promise<void> {
    return this.queryBus.execute(
      new GetCustomersQuery(
        user.tenantId,
        dto.page,
        dto.limit,
        dto.onboardingStatus,
        dto.isActive,
        dto.isCompany,
        dto.search,
      ),
    );
  }

  @Get('me')
  getCustomer(@CurrentUser() user: ReqUser): Promise<MeCustomerResponseDto> {
    return this.queryBus.execute(new GetCustomerQuery(user.id));
  }

  @Get(':id')
  getCustomerDetail(@CurrentUser() user: ReqUser, @Param('id') id: string): Promise<CustomerDetailResponseDto> {
    return this.queryBus.execute(new GetCustomerDetailQuery(user.tenantId, id));
  }
}
