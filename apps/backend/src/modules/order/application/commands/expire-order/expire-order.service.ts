import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OrderStatus } from '@repo/types';
import { err, ok, Result } from 'neverthrow';

import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { ExpireOrderCommand } from './expire-order.command';
import { InvalidOrderStatusTransitionException } from '../../../domain/exceptions/order.exceptions';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

type ExpireOrderError = OrderNotFoundError | OrderStatusTransitionNotAllowedError;

@CommandHandler(ExpireOrderCommand)
export class ExpireOrderService implements ICommandHandler<ExpireOrderCommand, Result<void, ExpireOrderError>> {
  constructor(private readonly orderRepository: OrderRepository) {}

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

    await this.orderRepository.save(order);
    return ok(undefined);
  }
}
