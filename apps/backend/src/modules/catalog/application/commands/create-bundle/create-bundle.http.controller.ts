import { BadRequestException, Body, ConflictException, Controller, NotFoundException, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CreateBundleCommand } from './create-bundle.command';
import { CreateBundleRequestDto } from './create-bundle.request.dto';
import { CreateBundleResponseDto } from './create-bundle.response.dto';
import {
  BundleAlreadyRetiredError,
  DuplicateBundleComponentError,
  InvalidBundleComponentQuantityError,
  InvalidBundleNameError,
  ReferencedProductTypeNotFoundError,
} from '../../../domain/errors/catalog.errors';

@Controller('bundles')
export class CreateBundleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBundleRequestDto,
  ): Promise<CreateBundleResponseDto> {
    const result = await this.commandBus.execute(
      new CreateBundleCommand(
        user.tenantId,
        dto.billingUnitId,
        dto.name,
        dto.imageUrl,
        dto.isActive,
        dto.components,
        dto.description,
      ),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof ReferencedProductTypeNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof InvalidBundleNameError || error instanceof InvalidBundleComponentQuantityError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof DuplicateBundleComponentError || error instanceof BundleAlreadyRetiredError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    return result.value;
  }
}
