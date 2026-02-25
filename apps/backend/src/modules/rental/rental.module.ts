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

@Module({
  imports: [TenancyModule, InventoryModule, CustomerModule],
  controllers: [BookingController],
  providers: [
    AvailabilityService,
    CreateBookingCommand,
    PricingEngine,

    {
      provide: BookingRepository,
      useClass: PrismaBookingRepository,
    },
  ],
})
export class RentalModule {}
