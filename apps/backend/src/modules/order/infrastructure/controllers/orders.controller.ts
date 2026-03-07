import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CreateOrderCommand } from '../../application/commands/create-order/create-order.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { OrderItemUnavailableError } from '../../domain/exceptions/order.exceptions';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { GetOrdersScheduleQueryDto } from '../../application/dto/get-orders-schedule-query.dto';
import { GetOrdersScheduleQuery } from '../../application/queries/get-orders-schedule.query';
import { ProblemException } from 'src/core/exceptions/problem.exception';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrderDto) {
    const command = new CreateOrderCommand(
      dto.locationId,
      dto.customerId ?? null,
      { start: new Date(dto.periodStart), end: new Date(dto.periodEnd) },
      dto.items,
      dto.currency,
    );

    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof OrderItemUnavailableError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Order Items Unavailable',
          error.message,
          'errors://order-items-unavailable',
          { unavailableItems: error.unavailableItems },
        );
      }
      throw error;
    }

    return result;
  }

  @Get('schedule')
  async getOrdersSchedule(@Query() query: GetOrdersScheduleQueryDto) {
    const result = await this.queryBus.execute(new GetOrdersScheduleQuery(query.locationId, query.from, query.to));

    return result;
  }
}
