import { Module } from '@nestjs/common';
import { OrderRepository } from './infrastructure/persistence/repositories/order.repository';
import { PricingModule } from '../pricing/pricing.module';
import { CreateOrderService } from './application/commands/create-order/create-order.service';
import { InventoryModule } from '../inventory/inventory.module';
import { GetOrdersScheduleQueryHandler } from './application/queries/get-orders-schedule/get-orders-schedule.query-handler';
import { GetOrderByIdQueryHandler } from './application/queries/get-order-by-id/get-order-by-id.query-handler';
import { GetCalendarDotsQueryHandler } from './application/queries/get-calendar-dots/get-calendar-dots.query-handler';
import { CatalogModule } from '../catalog/catalog.module';
import { TenantModule } from '../tenant/tenant.module';
import { CreateOrderItemResolver } from './application/commands/create-order/create-order-item-resolver';
import { CreateOrderAssetResolver } from './application/commands/create-order/create-order-asset-resolver';
import { CreateOrderOwnerContractResolver } from './application/commands/create-order/create-order-owner-contract-resolver';
import { CreateOrderHttpController } from './application/commands/create-order/create-order.http.controller';
import { GetOrdersScheduleHttpController } from './application/queries/get-orders-schedule/get-orders-schedule.http.controller';
import { GetCalendarDotsHttpController } from './application/queries/get-calendar-dots/get-calendar-dots.http.controller';
import { GetOrderByIdHttpController } from './application/queries/get-order-by-id/get-order-by-id.http.controller';

@Module({
  imports: [PricingModule, InventoryModule, CatalogModule, TenantModule],
  controllers: [
    CreateOrderHttpController,
    GetOrdersScheduleHttpController,
    GetCalendarDotsHttpController,
    GetOrderByIdHttpController,
  ],
  providers: [
    OrderRepository,
    CreateOrderItemResolver,
    CreateOrderAssetResolver,
    CreateOrderOwnerContractResolver,
    CreateOrderService,
    GetOrdersScheduleQueryHandler,
    GetCalendarDotsQueryHandler,
    GetOrderByIdQueryHandler,
  ],
})
export class OrderModule {}
