import { Controller, Delete, HttpCode, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { DeleteLongRentalDiscountCommand } from './delete-long-rental-discount.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/long-rental-discounts')
export class DeleteLongRentalDiscountHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeleteLongRentalDiscountCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof LongRentalDiscountNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
