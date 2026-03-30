import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { UserOnlyGuard } from 'src/modules/auth/infrastructure/guards/user-only.guard';

import { ActivateOrderCommand } from './activate-order.command';
import { ActivateOrderRequestDto } from './activate-order.request.dto';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

@UseGuards(UserOnlyGuard)
@Controller('orders/:orderId/activate')
export class ActivateOrderHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@CurrentUser() user: AuthenticatedUser, @Param() dto: ActivateOrderRequestDto): Promise<void> {
    const result = await this.commandBus.execute(new ActivateOrderCommand(user.tenantId, dto.orderId));

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
