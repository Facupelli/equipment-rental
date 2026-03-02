import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/create-order.use-case';
import { CreateBookingDto } from '../../application/dto/create-booking.dto';
import { GetTodayOverviewResponse, GetUpcomingScheduleResponse } from '@repo/schemas';
import { BookingQueryService } from '../../application/booking-query.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly bookingQueryService: BookingQueryService,
    private readonly createOrderUseCase: CreateOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateBookingDto): Promise<string> {
    return this.createOrderUseCase.execute(dto);
  }

  @Get('today-overview')
  async getTodayOverview(): Promise<GetTodayOverviewResponse> {
    return await this.bookingQueryService.getTodayOverview();
  }

  @Get('upcoming-schedule')
  async getUpcomingSchedule(): Promise<GetUpcomingScheduleResponse> {
    return await this.bookingQueryService.getUpcomingSchedule();
  }
}
