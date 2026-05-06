import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { Result } from 'neverthrow';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import { OrderPricingTargetTotalInvalidError } from 'src/modules/order/domain/errors/order.errors';
import {
  PricingBundleNotFoundError,
  PricingInvalidBookingLocationError,
  PricingPeriodInvalidError,
  PricingProductTypeNotFoundError,
} from 'src/modules/pricing/domain/errors/pricing.errors';

import { PreviewOrderPricingQuery } from './preview-order-pricing.query';
import { PreviewOrderPricingError } from './preview-order-pricing.query-handler';
import { PreviewOrderPricingRequestDto } from './preview-order-pricing.request.dto';
import { PreviewOrderPricingResponseDto } from './preview-order-pricing.response.dto';

@StaffRoute(Permission.CREATE_ORDERS)
@Controller('orders/pricing/preview')
export class PreviewOrderPricingHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async previewOrderPricing(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PreviewOrderPricingRequestDto,
  ): Promise<PreviewOrderPricingResponseDto> {
    const result = await this.queryBus.execute<
      PreviewOrderPricingQuery,
      Result<PreviewOrderPricingResponseDto, PreviewOrderPricingError>
    >(
      new PreviewOrderPricingQuery(
        user.tenantId,
        dto.locationId,
        dto.currency,
        dto.pickupDate,
        dto.returnDate,
        dto.pickupTime,
        dto.returnTime,
        dto.items,
        dto.insuranceSelected,
        dto.customerId,
        dto.couponCode,
        dto.pricingAdjustment,
      ),
    );

    if (result.isOk()) {
      return result.value;
    }

    const error = result.error;

    if (error instanceof PricingPeriodInvalidError) {
      throw new ProblemException(
        HttpStatus.BAD_REQUEST,
        'Invalid Rental Period',
        error.message,
        'errors://invalid-rental-period',
      );
    }

    if (error instanceof PricingInvalidBookingLocationError) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Invalid Booking Context',
        error.message,
        'errors://invalid-booking-context',
      );
    }

    if (error instanceof PricingProductTypeNotFoundError || error instanceof PricingBundleNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (error instanceof ProductTypeInactiveForBookingError || error instanceof BundleInactiveForBookingError) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Inactive Catalog Item',
        error.message,
        'errors://inactive-catalog-item',
      );
    }

    if (error instanceof ProductTypeNotBookableAtLocationError || error instanceof BundleNotBookableAtLocationError) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Invalid Booking Context',
        error.message,
        'errors://invalid-booking-context',
      );
    }

    if (error instanceof OrderPricingTargetTotalInvalidError) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Invalid Draft Pricing Target',
        error.message,
        'errors://invalid-draft-pricing-target',
      );
    }

    throw error;
  }
}
