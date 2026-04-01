import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CouponNotFoundError } from '../../../domain/errors/pricing.errors';

import { DeactivateCouponCommand } from './deactivate-coupon.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/coupons')
export class DeactivateCouponHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeactivateCouponCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof CouponNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
