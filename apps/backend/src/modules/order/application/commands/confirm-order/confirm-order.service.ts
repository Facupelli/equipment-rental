import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';

import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { ConfirmOrderCommand } from './confirm-order.command';
import { InvalidOrderStatusTransitionException } from '../../../domain/exceptions/order.exceptions';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

type ConfirmOrderError = OrderNotFoundError | OrderStatusTransitionNotAllowedError;

@CommandHandler(ConfirmOrderCommand)
export class ConfirmOrderService implements ICommandHandler<ConfirmOrderCommand, Result<void, ConfirmOrderError>> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: ConfirmOrderCommand): Promise<Result<void, ConfirmOrderError>> {
    const order = await this.orderRepository.load(command.orderId, command.tenantId);

    if (!order) {
      return err(new OrderNotFoundError(command.orderId));
    }

    try {
      order.confirm();
    } catch (error) {
      if (error instanceof InvalidOrderStatusTransitionException) {
        return err(new OrderStatusTransitionNotAllowedError(order.currentStatus, 'CONFIRMED' as never));
      }

      throw error;
    }

    await this.orderRepository.save(order);
    return ok(undefined);
  }
}
