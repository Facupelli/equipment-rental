import { ConflictException, Controller, Delete, HttpCode, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CouponInUseError, CouponNotFoundError } from '../../../domain/errors/pricing.errors';

import { DeleteCouponCommand } from './delete-coupon.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/coupons')
export class DeleteCouponHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeleteCouponCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof CouponNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CouponInUseError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
