import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CouponNotFoundError } from '../../../domain/errors/pricing.errors';

import { ActivateCouponCommand } from './activate-coupon.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/coupons')
export class ActivateCouponHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new ActivateCouponCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof CouponNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
