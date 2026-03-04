import { Body, Controller, Post } from '@nestjs/common';
import { CreateProductTypeDto } from '../../application/dto/create-product-type.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateProductTypeCommand } from '../../application/commands/create-product-type/create-product-type.command';

@Controller('product-types')
export class ProductTypeController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createProductType(@Body() dto: CreateProductTypeDto): Promise<string> {
    const command = new CreateProductTypeCommand(dto);

    return await this.commandBus.execute(command);
  }
}
