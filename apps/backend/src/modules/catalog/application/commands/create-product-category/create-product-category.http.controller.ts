import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CreateProductCategoryCommand } from './create-product-category.command';
import { CreateProductCategoryRequestDto } from './create-product-category.request.dto';
import { CreateProductCategoryResponseDto } from './create-product-category.response.dto';
import { InvalidProductCategoryNameError } from '../../../domain/errors/catalog.errors';

@StaffRoute(Permission.CREATE_PRODUCTS)
@Controller('product-categories')
export class CreateProductCategoryHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductCategoryRequestDto,
  ): Promise<CreateProductCategoryResponseDto> {
    const result = await this.commandBus.execute(
      new CreateProductCategoryCommand(user.tenantId, dto.name, dto.description),
    );

    if (result.isErr()) {
      if (result.error instanceof InvalidProductCategoryNameError) {
        throw new BadRequestException(result.error.message);
      }

      throw result.error;
    }

    return result.value;
  }
}
