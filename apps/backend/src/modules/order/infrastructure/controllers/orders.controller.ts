import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/create-order.use-case';
import { GetTodayOverviewResponse, GetUpcomingScheduleResponse } from '@repo/schemas';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { OrdersQueryService } from '../../application/orders-query.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersQueryService: OrdersQueryService,
    private readonly createOrderUseCase: CreateOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateOrderDto): Promise<string> {
    return this.createOrderUseCase.execute(dto);
  }

  @Get('today-overview')
  async getTodayOverview(): Promise<GetTodayOverviewResponse> {
    return await this.ordersQueryService.getTodayOverview();
  }

  @Get('upcoming-schedule')
  async getUpcomingSchedule(): Promise<GetUpcomingScheduleResponse> {
    return await this.ordersQueryService.getUpcomingSchedule();
  }
}
