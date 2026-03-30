import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OrderAssignmentStage, OrderStatus } from '@repo/types';
import { err, ok, Result } from 'neverthrow';
import { PrismaService } from 'src/core/database/prisma.service';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';

import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { ExpireOrderCommand } from './expire-order.command';
import { InvalidOrderStatusTransitionException } from '../../../domain/exceptions/order.exceptions';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

type ExpireOrderError = OrderNotFoundError | OrderStatusTransitionNotAllowedError;

@CommandHandler(ExpireOrderCommand)
export class ExpireOrderService implements ICommandHandler<ExpireOrderCommand, Result<void, ExpireOrderError>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderRepository: OrderRepository,
    private readonly inventoryApi: InventoryPublicApi,
  ) {}

  async execute(command: ExpireOrderCommand): Promise<Result<void, ExpireOrderError>> {
    const order = await this.orderRepository.load(command.orderId, command.tenantId);

    if (!order) {
      return err(new OrderNotFoundError(command.orderId));
    }

    try {
      order.expire();
    } catch (error) {
      if (error instanceof InvalidOrderStatusTransitionException) {
        return err(new OrderStatusTransitionNotAllowedError(order.currentStatus, OrderStatus.EXPIRED));
      }

      throw error;
    }

    await this.prisma.client.$transaction(async (tx) => {
      await this.orderRepository.save(order, tx);
      await this.inventoryApi.releaseOrderAssignments(order.id, OrderAssignmentStage.HOLD, tx);
    });

    return ok(undefined);
  }
}
