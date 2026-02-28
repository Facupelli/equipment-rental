import { Module } from '@nestjs/common';
import { PricingEngine } from './application/pricing-engine/pricing-engine';
import { CreateBookingCommand } from './application/create-booking.command';
import { AvailabilityService } from './application/availability.service';
import { TenancyModule } from '../tenancy/tenancy.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomerModule } from '../customer/customer.module';
import { BookingRepository } from './domain/ports/booking.repository';
import { PrismaBookingRepository } from './infrastructure/persistence/prisma-booking.repository';
import { BookingController } from './infrastructure/controllers/booking.controller';
import { BookingQueryService } from './application/booking-query.service';
import { PrismaBookingQueryRepository } from './infrastructure/persistence/prisma-booking-query.repository';
import { BookingQueryPort } from './domain/ports/booking-query.port';

@Module({
  imports: [TenancyModule, InventoryModule, CustomerModule],
  controllers: [BookingController],
  providers: [
    AvailabilityService,
    CreateBookingCommand,
    BookingQueryService,
    PricingEngine,

    {
      provide: BookingRepository,
      useClass: PrismaBookingRepository,
    },
    {
      provide: BookingQueryPort,
      useClass: PrismaBookingQueryRepository,
    },
  ],
})
export class RentalModule {}
