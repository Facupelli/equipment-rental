import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateBookingCommand } from '../../application/create-booking.command';
import { CreateBookingDto } from '../../application/dto/create-booking.dto';
import { GetTodayOverviewResponse, GetUpcomingScheduleResponse } from '@repo/schemas';
import { BookingQueryService } from '../../application/booking-query.service';

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingQueryService: BookingQueryService,
    private readonly createBookingCommand: CreateBookingCommand,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Body() command: CreateBookingDto): Promise<string> {
    return this.createBookingCommand.execute(command);
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
