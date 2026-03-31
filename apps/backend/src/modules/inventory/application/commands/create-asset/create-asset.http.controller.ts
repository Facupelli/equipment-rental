import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, ConflictException, Controller, NotFoundException, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import {
  DuplicateSerialNumberError,
  ProductTypeNotFoundError,
  SerialNumberRequiredError,
} from '../../../domain/errors/inventory.errors';
import { CreateAssetCommand } from './create-asset.command';
import { CreateAssetRequestDto } from './create-asset.request.dto';
import { CreateAssetResponseDto } from './create-asset.response.dto';

@StaffRoute(Permission.CREATE_ASSETS)
@Controller('assets')
export class CreateAssetHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(@Body() dto: CreateAssetRequestDto): Promise<CreateAssetResponseDto> {
    const result = await this.commandBus.execute(
      new CreateAssetCommand(dto.locationId, dto.productTypeId, dto.ownerId, dto.serialNumber, dto.notes),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof ProductTypeNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof DuplicateSerialNumberError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof SerialNumberRequiredError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    return { id: result.value };
  }
}
