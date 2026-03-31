import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { BadRequestException, Body, ConflictException, Controller, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  CouponCodeAlreadyExistsError,
  PricingRuleNotCouponTypeError,
  PricingRuleNotFoundError,
} from '../../../domain/errors/pricing.errors';
import { CreateCouponCommand } from './create-coupon.command';
import { CreateCouponRequestDto } from './create-coupon.request.dto';
import { CreateCouponResponseDto } from './create-coupon.response.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/coupons')
export class CreateCouponHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCouponRequestDto,
  ): Promise<CreateCouponResponseDto> {
    const result = await this.commandBus.execute(
      new CreateCouponCommand(
        user.tenantId,
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

      if (error instanceof CouponCodeAlreadyExistsError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof PricingRuleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof PricingRuleNotCouponTypeError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const response: CreateCouponResponseDto = { id: result.value };
    return response;
  }
}
