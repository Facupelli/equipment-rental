import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CancelOrderCommand } from './cancel-order.command';
import { CancelOrderRequestDto } from './cancel-order.request.dto';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

@StaffRoute(Permission.CANCEL_ORDERS)
@Controller('orders/:orderId/cancel')
export class CancelOrderHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(@CurrentUser() user: AuthenticatedUser, @Param() dto: CancelOrderRequestDto): Promise<void> {
    const result = await this.commandBus.execute(new CancelOrderCommand(user.tenantId, dto.orderId));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof OrderStatusTransitionNotAllowedError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Order Transition',
          error.message,
          'errors://invalid-order-transition',
        );
      }

      throw error;
    }
  }
}
