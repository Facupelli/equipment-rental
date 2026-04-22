import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { MarkEquipmentAsRetiredCommand } from './mark-equipment-as-retired.command';
import { MarkEquipmentAsRetiredRequestDto } from './mark-equipment-as-retired.request.dto';
import { OrderNotFoundError, OrderStatusTransitionNotAllowedError } from '../../../domain/errors/order.errors';

@StaffRoute(Permission.CONFIRM_ORDERS)
@Controller('orders/:orderId/mark-equipment-retired')
export class MarkEquipmentAsRetiredHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async markEquipmentAsRetired(
    @CurrentUser() user: AuthenticatedUser,
    @Param() dto: MarkEquipmentAsRetiredRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(new MarkEquipmentAsRetiredCommand(user.tenantId, dto.orderId));

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
