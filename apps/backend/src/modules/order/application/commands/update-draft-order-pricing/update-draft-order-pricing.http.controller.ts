import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { updateDraftOrderPricingRequestSchema } from '@repo/schemas';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { UpdateDraftOrderPricingCommand } from './update-draft-order-pricing.command';
import {
  UpdateDraftOrderPricingParamDto,
  UpdateDraftOrderPricingRequestDto,
} from './update-draft-order-pricing.request.dto';
import {
  OrderNotFoundError,
  OrderPricingAdjustmentNotAllowedError,
  OrderPricingItemFinalPriceInvalidError,
  OrderPricingItemsPayloadMismatchError,
  OrderPricingItemNotFoundError,
  OrderPricingTargetTotalInvalidError,
} from '../../../domain/errors/order.errors';

@StaffRoute(Permission.CREATE_ORDERS)
@Controller('orders/:orderId/draft-pricing')
export class UpdateDraftOrderPricingHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: UpdateDraftOrderPricingParamDto,
    @Body() body: unknown,
  ): Promise<void> {
    const dto: UpdateDraftOrderPricingRequestDto = updateDraftOrderPricingRequestSchema.parse(body);

    const result = await this.commandBus.execute(
      new UpdateDraftOrderPricingCommand({
        tenantId: user.tenantId,
        orderId: params.orderId,
        setByUserId: user.id,
        mode: dto.mode,
        targetTotal: dto.mode === 'TARGET_TOTAL' ? dto.targetTotal : undefined,
        items: dto.mode === 'ITEMS' ? dto.items : undefined,
      }),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof OrderPricingAdjustmentNotAllowedError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Draft Pricing Not Allowed',
          error.message,
          'errors://draft-pricing-not-allowed',
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

      if (error instanceof OrderPricingItemsPayloadMismatchError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Draft Pricing Items',
          error.message,
          'errors://invalid-draft-pricing-items',
        );
      }

      if (error instanceof OrderPricingItemNotFoundError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Draft Pricing Item Not Found',
          error.message,
          'errors://draft-pricing-item-not-found',
        );
      }

      if (error instanceof OrderPricingItemFinalPriceInvalidError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Draft Pricing Item',
          error.message,
          'errors://invalid-draft-pricing-item',
        );
      }

      throw error;
    }
  }
}
