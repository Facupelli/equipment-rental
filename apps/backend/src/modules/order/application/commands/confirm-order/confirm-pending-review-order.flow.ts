import { Injectable } from '@nestjs/common';
import { OrderAssignmentStage } from '@repo/types';
import { err, ok, Result } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';

import { Order } from '../../../domain/entities/order.entity';
import { InvalidOrderStatusTransitionException } from '../../../domain/exceptions/order.exceptions';
import { OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

type ConfirmPendingReviewOrderError = OrderStatusTransitionNotAllowedError;

@Injectable()
export class ConfirmPendingReviewOrderFlow {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderRepository: OrderRepository,
    private readonly inventoryApi: InventoryPublicApi,
  ) {}

  async execute(order: Order): Promise<Result<void, ConfirmPendingReviewOrderError>> {
    try {
      order.confirm();
    } catch (error) {
      if (error instanceof InvalidOrderStatusTransitionException) {
        return err(new OrderStatusTransitionNotAllowedError(order.currentStatus, 'CONFIRMED' as never));
      }

      throw error;
    }

    await this.prisma.client.$transaction(async (tx) => {
      await this.orderRepository.save(order, tx);
      await this.inventoryApi.transitionOrderAssignmentsStage(
        order.id,
        OrderAssignmentStage.HOLD,
        OrderAssignmentStage.COMMITTED,
        tx,
      );
    });

    return ok(undefined);
  }
}
