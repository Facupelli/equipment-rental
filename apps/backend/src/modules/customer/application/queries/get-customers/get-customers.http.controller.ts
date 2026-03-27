import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { UserOnlyGuard } from 'src/modules/auth/infrastructure/guards/user-only.guard';
import { GetCustomersQuery } from './get-customers.query';
import { GetCustomersRequestDto } from './get-customers.request.dto';
import { GetCustomersResponseDto } from './get-customers.response.dto';
import { GetCustomersResult } from './get-customers.read-model';

@UseGuards(UserOnlyGuard)
@Controller('customers')
export class GetCustomersHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  async getCustomers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetCustomersRequestDto,
  ): Promise<GetCustomersResponseDto> {
    const result: GetCustomersResult = await this.queryBus.execute(
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

    return {
      data: result.data.map((customer) => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        isCompany: customer.isCompany,
        companyName: customer.companyName,
        isActive: customer.isActive,
        onboardingStatus: customer.onboardingStatus,
        createdAt: customer.createdAt,
      })),
      meta: result.meta,
    };
  }
}
