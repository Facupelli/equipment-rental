import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCustomersQuery } from '../../application/queries/get-customers/get-customers.query';
import { GetCustomersQueryDto } from '../../application/dto/get-customers-query.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

@Controller('customers')
export class CustomerController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
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
}
