import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateOrderCommand } from '../../application/commands/create-order/create-order.command';
import { CommandBus } from '@nestjs/cqrs';
import { OrderItemUnavailableError } from '../../domain/exceptions/order.exceptions';
import { CreateOrderDto } from '../../application/dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrderDto) {
    const command = new CreateOrderCommand(
      dto.locationId,
      dto.customerId ?? null,
      { start: new Date(dto.periodStart), end: new Date(dto.periodEnd) },
      dto.items,
      dto.currency,
    );

    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof OrderItemUnavailableError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    return result;
  }
}
