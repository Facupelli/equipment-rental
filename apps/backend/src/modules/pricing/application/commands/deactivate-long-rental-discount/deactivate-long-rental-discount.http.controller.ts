import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { DeactivateLongRentalDiscountCommand } from './deactivate-long-rental-discount.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/long-rental-discounts')
export class DeactivateLongRentalDiscountHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeactivateLongRentalDiscountCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof LongRentalDiscountNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
