import { Module } from '@nestjs/common';
import { PricingEngine } from './application/pricing-engine/pricing-engine';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { TenantModule } from '../tenant/tenant.module';
import { OrderRepositoryPort } from './domain/ports/order.repository.port';
import { OrderRepository } from './infrastructure/persistence/repositories/order.repository';

@Module({
  imports: [TenantModule],
  controllers: [OrdersController],
  providers: [
    PricingEngine,

    {
      provide: OrderRepositoryPort,
      useClass: OrderRepository,
    },
  ],
})
export class OrderModule {}
