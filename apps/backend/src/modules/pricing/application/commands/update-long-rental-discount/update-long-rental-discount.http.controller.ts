import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Param, Put } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { UpdateLongRentalDiscountCommand } from './update-long-rental-discount.command';
import { UpdateLongRentalDiscountRequestDto } from './update-long-rental-discount.request.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/long-rental-discounts')
export class UpdateLongRentalDiscountHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLongRentalDiscountRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdateLongRentalDiscountCommand(user.tenantId, id, dto.name, dto.priority, dto.tiers, dto.target),
    );

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof LongRentalDiscountNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
