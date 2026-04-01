import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  BundleAlreadyRetiredError,
  BundleNotFoundError,
  DuplicateBundleComponentError,
  InvalidBundleComponentQuantityError,
  InvalidBundleNameError,
  ReferencedProductTypeNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';

import { UpdateBundleCommand } from './update-bundle.command';
import { UpdateBundleRequestDto } from './update-bundle.request.dto';

@StaffRoute(Permission.MANAGE_BUNDLES)
@Controller('bundles')
export class UpdateBundleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBundleRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdateBundleCommand(user.tenantId, id, {
        billingUnitId: dto.billingUnitId,
        name: dto.name,
        imageUrl: dto.imageUrl,
        description: dto.description,
        components: dto.components,
      }),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof BundleNotFoundError || error instanceof ReferencedProductTypeNotFoundError) {
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
  }
}
