import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { CreateOrderCommand } from '../../application/commands/create-order/create-order.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { GetOrdersScheduleQueryDto } from '../../application/dto/get-orders-schedule-query.dto';
import { GetOrdersScheduleQuery } from '../../application/queries/get-orders-schedule.query';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { GetOrderByIdQuery } from '../../application/queries/get-order-by-id/get-order-by-id.query';
import { GetCalendarDotsQueryDto } from '../../application/dto/get-calendar-dots-query.dto';
import { GetCalendarDotsQuery } from '../../application/queries/get-calendars-dots/get-calendar-dots.query';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import {
  InvalidPickupSlotError,
  InvalidReturnSlotError,
  OrderItemUnavailableError,
} from '../../application/errors/order.errors';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: ReqUser, @Body() dto: CreateOrderDto) {
    const command = new CreateOrderCommand(
      user.tenantId,
      dto.locationId,
      dto.customerId,
      { start: new Date(dto.periodStart), end: new Date(dto.periodEnd) },
      dto.pickupTime,
      dto.returnTime,
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
          { unavailableItems: error.unavailableItems, conflictGroups: error.conflictGroups },
        );
      }

      if (error instanceof InvalidPickupSlotError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Pickup Slot',
          error.message,
          'errors://invalid-pickup-slot',
        );
      }

      if (error instanceof InvalidReturnSlotError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Return Slot',
          error.message,
          'errors://invalid-return-slot',
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

  @Get('calendar-dots')
  async getCalendarDtos(@Query() query: GetCalendarDotsQueryDto) {
    const result = await this.queryBus.execute(new GetCalendarDotsQuery(query.locationId, query.from, query.to));

    return result;
  }

  @Get(':id')
  async getOrderById(@Param() params: { id: string }) {
    const result = await this.queryBus.execute(new GetOrderByIdQuery(params.id));
    return result;
  }
}
