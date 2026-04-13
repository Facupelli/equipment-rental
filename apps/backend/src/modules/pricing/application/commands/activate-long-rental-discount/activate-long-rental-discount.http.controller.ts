import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { ActivateLongRentalDiscountCommand } from './activate-long-rental-discount.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/long-rental-discounts')
export class ActivateLongRentalDiscountHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new ActivateLongRentalDiscountCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof LongRentalDiscountNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
