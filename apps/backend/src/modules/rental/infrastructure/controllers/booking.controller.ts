import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateBookingCommand } from '../../application/create-booking.command';
import { CreateBookingDto } from '../../application/dto/create-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly createBookingCommand: CreateBookingCommand) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Body() command: CreateBookingDto): Promise<string> {
    return this.createBookingCommand.execute(command);
  }
}
