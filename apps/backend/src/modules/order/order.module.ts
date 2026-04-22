import { Module } from '@nestjs/common';
import { OrderRepository } from './infrastructure/persistence/repositories/order.repository';
import { PricingModule } from '../pricing/pricing.module';
import { CreateOrderService } from './application/commands/create-order/create-order.service';
import { ConfirmOrderService } from './application/commands/confirm-order/confirm-order.service';
import { RejectOrderService } from './application/commands/reject-order/reject-order.service';
import { CancelOrderService } from './application/commands/cancel-order/cancel-order.service';
import { ActivateOrderService } from './application/commands/activate-order/activate-order.service';
import { CompleteOrderService } from './application/commands/complete-order/complete-order.service';
import { ExpireOrderService } from './application/commands/expire-order/expire-order.service';
import { InventoryModule } from '../inventory/inventory.module';
import { GetOrdersScheduleQueryHandler } from './application/queries/get-orders-schedule/get-orders-schedule.query-handler';
import { GetOrderByIdQueryHandler } from './application/queries/get-order-by-id/get-order-by-id.query-handler';
import { GetCalendarDotsQueryHandler } from './application/queries/get-calendar-dots/get-calendar-dots.query-handler';
import { GetPendingReviewOrdersQueryHandler } from './application/queries/get-pending-review-orders/get-pending-review-orders.query-handler';
import { GetOrdersQueryHandler } from './application/queries/get-orders/get-orders.query-handler';
import { TenantModule } from '../tenant/tenant.module';
import { CreateOrderAssetResolver } from './application/commands/create-order/create-order-asset-resolver';
import { CreateOrderOwnerContractResolver } from './application/commands/create-order/create-order-owner-contract-resolver';
import { CreateOrderHttpController } from './application/commands/create-order/create-order.http.controller';
import { ConfirmOrderHttpController } from './application/commands/confirm-order/confirm-order.http.controller';
import { RejectOrderHttpController } from './application/commands/reject-order/reject-order.http.controller';
import { CancelOrderHttpController } from './application/commands/cancel-order/cancel-order.http.controller';
import { ActivateOrderHttpController } from './application/commands/activate-order/activate-order.http.controller';
import { CompleteOrderHttpController } from './application/commands/complete-order/complete-order.http.controller';
import { GetOrdersScheduleHttpController } from './application/queries/get-orders-schedule/get-orders-schedule.http.controller';
import { GetCalendarDotsHttpController } from './application/queries/get-calendar-dots/get-calendar-dots.http.controller';
import { GetOrderByIdHttpController } from './application/queries/get-order-by-id/get-order-by-id.http.controller';
import { GetPendingReviewOrdersHttpController } from './application/queries/get-pending-review-orders/get-pending-review-orders.http.controller';
import { GetOrdersHttpController } from './application/queries/get-orders/get-orders.http.controller';
import { GenerateOrderContractHttpController } from './application/queries/generate-order-contract/generate-order-contract.http.controller';
import { GenerateOrderContractService } from './application/queries/generate-order-contract/generate-order-contract.service';
import { ContractRendererAdapter } from './infrastructure/pdf/contract-renderer.adapter';
import { ContractRendererPort } from './domain/ports/contract-render.port';

@Module({
  imports: [PricingModule, InventoryModule, TenantModule],
  controllers: [
    CreateOrderHttpController,
    ConfirmOrderHttpController,
    RejectOrderHttpController,
    CancelOrderHttpController,
    ActivateOrderHttpController,
    CompleteOrderHttpController,
    GetOrdersHttpController,
    GetPendingReviewOrdersHttpController,
    GetOrdersScheduleHttpController,
    GetCalendarDotsHttpController,
    GetOrderByIdHttpController,
    GenerateOrderContractHttpController,
  ],
  providers: [
    OrderRepository,
    CreateOrderAssetResolver,
    CreateOrderOwnerContractResolver,
    CreateOrderService,
    ConfirmOrderService,
    RejectOrderService,
    CancelOrderService,
    ActivateOrderService,
    CompleteOrderService,
    ExpireOrderService,
    GetOrdersScheduleQueryHandler,
    GetCalendarDotsQueryHandler,
    GetOrderByIdQueryHandler,
    GetPendingReviewOrdersQueryHandler,
    GetOrdersQueryHandler,
    GenerateOrderContractService,
    {
      provide: ContractRendererPort,
      useClass: ContractRendererAdapter,
    },
  ],
})
export class OrderModule {}
