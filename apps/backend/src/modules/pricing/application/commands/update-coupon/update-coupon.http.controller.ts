import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import {
  CouponCodeAlreadyExistsError,
  CouponNotFoundError,
  PricingRuleNotCouponTypeError,
  PricingRuleNotFoundError,
} from '../../../domain/errors/pricing.errors';

import { UpdateCouponCommand } from './update-coupon.command';
import { UpdateCouponRequestDto } from './update-coupon.request.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/coupons')
export class UpdateCouponHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCouponRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdateCouponCommand(
        user.tenantId,
        id,
        dto.pricingRuleId,
        dto.code,
        dto.maxUses,
        dto.maxUsesPerCustomer,
        dto.restrictedToCustomerId,
        dto.validFrom,
        dto.validUntil,
      ),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof CouponNotFoundError || error instanceof PricingRuleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CouponCodeAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof PricingRuleNotCouponTypeError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
