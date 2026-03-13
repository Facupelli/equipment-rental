import { Module } from '@nestjs/common';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { OrderRepositoryPort } from './domain/ports/order.repository.port';
import { OrderRepository } from './infrastructure/persistence/repositories/order.repository';
import { PricingModule } from '../pricing/pricing.module';
import { OrderQueryService } from './infrastructure/services/order-query.service';
import { CreateOrderHandler } from './application/commands/create-order/create-order.command-handler';
import { InventoryModule } from '../inventory/inventory.module';
import { GetOrdersScheduleQueryHandler } from './application/queries/get-orders-schedule.query-handler';
import { GetOrderByIdQueryHandler } from './application/queries/get-order-by-id/get-order-by-id.query-handler';
import { GetCalendarDotsQueryHandler } from './application/queries/get-calendars-dots/get-calendar-dots.query-handler';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule, PricingModule, InventoryModule],
  controllers: [OrdersController],
  providers: [
    {
      provide: OrderRepositoryPort,
      useClass: OrderRepository,
    },
    OrderQueryService,
    CreateOrderHandler,
    GetOrdersScheduleQueryHandler,
    GetCalendarDotsQueryHandler,
    GetOrderByIdQueryHandler,
  ],
})
export class OrderModule {}
