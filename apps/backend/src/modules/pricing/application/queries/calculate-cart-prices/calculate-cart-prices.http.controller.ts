import { BadRequestException, Body, Controller, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Result } from 'neverthrow';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  PricingBundleNotFoundError,
  PricingPeriodInvalidError,
  PricingProductTypeNotFoundError,
} from '../../../domain/errors/pricing.errors';
import { CalculateCartPricesQuery } from './calculate-cart-prices.query';
import { CalculateCartPricesError, CartPriceResult } from './calculate-cart-prices.query-handler';
import { CalculateCartPricesRequestDto } from './calculate-cart-prices.request.dto';
import { CalculateCartPricesResponseDto } from './calculate-cart-prices.response.dto';

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
    );

    const result = await this.queryBus.execute<
      CalculateCartPricesQuery,
      Result<CartPriceResult, CalculateCartPricesError>
    >(query);

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof PricingPeriodInvalidError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof PricingProductTypeNotFoundError || error instanceof PricingBundleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

    const response: CalculateCartPricesResponseDto = result.value;
    return response;
  }
}
