import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { OrderAssignmentsNotFoundException, OrderNotFoundException } from '../../../domain/exceptions/order.exceptions';
import { GetOrderByIdQuery } from './get-order-by-id.query';
import { GetOrderByIdRequestDto } from './get-order-by-id.request.dto';
import { GetOrderByIdResponseDto } from './get-order-by-id.response.dto';

@Controller('orders')
export class GetOrderByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':orderId')
  async getOrderById(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: GetOrderByIdRequestDto,
  ): Promise<GetOrderByIdResponseDto> {
    try {
      return await this.queryBus.execute(new GetOrderByIdQuery(user.tenantId, params.orderId));
    } catch (error) {
      if (error instanceof OrderNotFoundException || error instanceof OrderAssignmentsNotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
