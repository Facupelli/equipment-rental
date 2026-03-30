import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OrderStatus } from '@repo/types';
import { err, ok, Result } from 'neverthrow';

import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { CancelOrderCommand } from './cancel-order.command';
import { InvalidOrderStatusTransitionException } from '../../../domain/exceptions/order.exceptions';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

type CancelOrderError = OrderNotFoundError | OrderStatusTransitionNotAllowedError;

@CommandHandler(CancelOrderCommand)
export class CancelOrderService implements ICommandHandler<CancelOrderCommand, Result<void, CancelOrderError>> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: CancelOrderCommand): Promise<Result<void, CancelOrderError>> {
    const order = await this.orderRepository.load(command.orderId, command.tenantId);

    if (!order) {
      return err(new OrderNotFoundError(command.orderId));
    }

    try {
      order.cancel();
    } catch (error) {
      if (error instanceof InvalidOrderStatusTransitionException) {
        return err(new OrderStatusTransitionNotAllowedError(order.currentStatus, OrderStatus.CANCELLED));
      }

      throw error;
    }

    await this.orderRepository.save(order);
    return ok(undefined);
  }
}
