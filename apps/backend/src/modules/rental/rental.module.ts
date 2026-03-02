import { Module } from '@nestjs/common';
import { PricingEngine } from './application/pricing-engine/pricing-engine';
import { AvailabilityService } from './application/availability.service';
import { TenancyModule } from '../tenancy/tenancy.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomerModule } from '../customer/customer.module';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { BookingQueryService } from './application/booking-query.service';
import { CreateOrderUseCase } from './application/create-order.use-case';
import { OrderRepositoryPort } from './application/ports/order.repository.port';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { OrdersQueryPort } from './application/ports/booking-query.port';
import { PrismaOrderQueryRepository } from './infrastructure/persistence/prisma-order-query.repository';

@Module({
  imports: [TenancyModule, InventoryModule, CustomerModule],
  controllers: [OrdersController],
  providers: [
    AvailabilityService,
    CreateOrderUseCase,
    BookingQueryService,
    PricingEngine,

    {
      provide: OrderRepositoryPort,
      useClass: PrismaOrderRepository,
    },
    {
      provide: OrdersQueryPort,
      useClass: PrismaOrderQueryRepository,
    },
  ],
})
export class RentalModule {}
