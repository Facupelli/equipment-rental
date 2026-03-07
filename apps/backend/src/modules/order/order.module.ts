import { Module } from '@nestjs/common';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { TenantModule } from '../tenant/tenant.module';
import { OrderRepositoryPort } from './domain/ports/order.repository.port';
import { OrderRepository } from './infrastructure/persistence/repositories/order.repository';
import { PricingModule } from '../pricing/pricing.module';
import { OrderQueryService } from './infrastructure/services/order-query.service';
import { CreateOrderHandler } from './application/commands/create-order/create-order.command-handler';
import { InventoryModule } from '../inventory/inventory.module';
import { GetOrdersScheduleQueryHandler } from './application/queries/get-orders-schedule.query-handler';

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
  ],
})
export class OrderModule {}
