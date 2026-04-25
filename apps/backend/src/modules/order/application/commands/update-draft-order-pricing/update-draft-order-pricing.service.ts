import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Decimal from 'decimal.js';
import { err, ok, Result } from 'neverthrow';
import { OrderStatus } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';
import { DraftOrderPricingService } from 'src/modules/order/domain/services/draft-order-pricing.service';
import { ManualPricingOverride } from 'src/modules/order/domain/value-objects/manual-pricing-override.value-object';
import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import {
  OrderItemNotFoundException,
  OrderPriceAdjustmentNotAllowedException,
} from 'src/modules/order/domain/exceptions/order.exceptions';

import { UpdateDraftOrderPricingCommand } from './update-draft-order-pricing.command';
import {
  OrderNotFoundError,
  OrderPricingAdjustmentNotAllowedError,
  OrderPricingItemFinalPriceInvalidError,
  OrderPricingItemsPayloadMismatchError,
  OrderPricingItemNotFoundError,
  OrderPricingTargetTotalInvalidError,
} from '../../../domain/errors/order.errors';

type UpdateDraftOrderPricingError =
  | OrderNotFoundError
  | OrderPricingAdjustmentNotAllowedError
  | OrderPricingItemFinalPriceInvalidError
  | OrderPricingItemsPayloadMismatchError
  | OrderPricingItemNotFoundError
  | OrderPricingTargetTotalInvalidError;

@CommandHandler(UpdateDraftOrderPricingCommand)
export class UpdateDraftOrderPricingService implements ICommandHandler<
  UpdateDraftOrderPricingCommand,
  Result<void, UpdateDraftOrderPricingError>
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderRepository: OrderRepository,
    private readonly draftOrderPricingService: DraftOrderPricingService,
  ) {}

  async execute(command: UpdateDraftOrderPricingCommand): Promise<Result<void, UpdateDraftOrderPricingError>> {
    const order = await this.orderRepository.load(command.orderId, command.tenantId);

    if (!order) {
      return err(new OrderNotFoundError(command.orderId));
    }

    if (order.currentStatus !== OrderStatus.DRAFT) {
      return err(new OrderPricingAdjustmentNotAllowedError(order.currentStatus));
    }

    try {
      const setAt = new Date();
      const finalPriceByItemId =
        command.mode === 'TARGET_TOTAL'
          ? this.draftOrderPricingService.buildFinalPriceMapFromTargetTotal(order, new Decimal(command.targetTotal!))
          : this.draftOrderPricingService.buildFinalPriceMapFromItems(order, command.items ?? []);

      await this.prisma.client.$transaction(async (tx) => {
        for (const [orderItemId, finalPrice] of finalPriceByItemId) {
          const item = order.getItems().find((candidate) => candidate.id === orderItemId);
          if (!item) {
            throw new OrderItemNotFoundException(orderItemId);
          }

          order.replaceItemManualPricingOverride(
            orderItemId,
            finalPrice.eq(item.calculatedPriceSnapshot.finalPrice)
              ? null
              : ManualPricingOverride.create({
                  finalPrice,
                  setByUserId: command.setByUserId,
                  setAt,
                  previousFinalPrice: item.effectiveFinalPrice,
                }),
          );
        }

        await this.orderRepository.save(order, tx);
      });
    } catch (error) {
      if (error instanceof OrderPricingTargetTotalInvalidError) {
        return err(error);
      }

      if (error instanceof OrderPricingItemsPayloadMismatchError) {
        return err(error);
      }

      if (error instanceof OrderPricingItemNotFoundError) {
        return err(error);
      }

      if (error instanceof OrderPricingItemFinalPriceInvalidError) {
        return err(error);
      }

      if (error instanceof OrderItemNotFoundException) {
        return err(new OrderPricingItemNotFoundError(error.itemId));
      }

      if (error instanceof OrderPriceAdjustmentNotAllowedException) {
        return err(new OrderPricingAdjustmentNotAllowedError(order.currentStatus));
      }

      throw error;
    }

    return ok(undefined);
  }
}
