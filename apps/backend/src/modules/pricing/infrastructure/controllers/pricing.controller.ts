import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CalculateCartPricesDto } from '../../application/dto/get-items-price-query.dto';
import { CalculateCartPricesQuery } from '../../application/queries/calculate-cart-prices/calculate-cart-prices.query';
import { CartPriceResult } from '@repo/schemas';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';

@Controller('pricing')
export class PricingController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * POST /pricing/cart/preview
   *
   * Stateless cart price preview. No side effects.
   * Returns a line-item price breakdown and grand total for the given cart.
   *
   */
  @Post('cart/preview')
  @HttpCode(HttpStatus.OK)
  async calculateCartPrices(@CurrentUser() user: ReqUser, @Body() dto: CalculateCartPricesDto) {
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

    const result: CartPriceResult = await this.queryBus.execute(query);
    return result;
  }
}
