import { CustomerOnly } from 'src/core/decorators/customer-only.decorator';
import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Result } from 'neverthrow';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import {
  PricingBundleNotFoundError,
  PricingInvalidBookingLocationError,
  PricingPeriodInvalidError,
  PricingProductTypeNotFoundError,
} from '../../../domain/errors/pricing.errors';
import { CalculateCartPricesQuery } from './calculate-cart-prices.query';
import { CalculateCartPricesError, CartPriceResult } from './calculate-cart-prices.query-handler';
import { CalculateCartPricesRequestDto } from './calculate-cart-prices.request.dto';
import { CalculateCartPricesResponseDto } from './calculate-cart-prices.response.dto';

@CustomerOnly()
@Controller('pricing')
export class CalculateCartPricesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Post('cart/preview')
  @HttpCode(HttpStatus.OK)
  async calculateCartPrices(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CalculateCartPricesRequestDto,
  ): Promise<CalculateCartPricesResponseDto> {
    const query = new CalculateCartPricesQuery(
      user.tenantId,
      dto.locationId,
      dto.currency,
      {
        start: new Date(dto.period.start),
        end: new Date(dto.period.end),
      },
      dto.items,
      dto.insuranceSelected,
    );

    const result = await this.queryBus.execute<
      CalculateCartPricesQuery,
      Result<CartPriceResult, CalculateCartPricesError>
    >(query);

    if (result.isErr()) {
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

      throw error;
    }

    const response: CalculateCartPricesResponseDto = result.value;
    return response;
  }
}
