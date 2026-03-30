import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OrderStatus } from '@repo/types';
import { err, ok, Result } from 'neverthrow';

import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { RejectOrderCommand } from './reject-order.command';
import { InvalidOrderStatusTransitionException } from '../../../domain/exceptions/order.exceptions';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

type RejectOrderError = OrderNotFoundError | OrderStatusTransitionNotAllowedError;

@CommandHandler(RejectOrderCommand)
export class RejectOrderService implements ICommandHandler<RejectOrderCommand, Result<void, RejectOrderError>> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: RejectOrderCommand): Promise<Result<void, RejectOrderError>> {
    const order = await this.orderRepository.load(command.orderId, command.tenantId);

    if (!order) {
      return err(new OrderNotFoundError(command.orderId));
    }

    try {
      order.reject();
    } catch (error) {
      if (error instanceof InvalidOrderStatusTransitionException) {
        return err(new OrderStatusTransitionNotAllowedError(order.currentStatus, OrderStatus.REJECTED));
      }

      throw error;
    }

    await this.orderRepository.save(order);
    return ok(undefined);
  }
}
