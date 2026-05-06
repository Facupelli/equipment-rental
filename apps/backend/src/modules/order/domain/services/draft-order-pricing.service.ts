import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';

import { Order } from '../entities/order.entity';
import {
  OrderPricingItemFinalPriceInvalidError,
  OrderPricingItemsPayloadMismatchError,
  OrderPricingItemNotFoundError,
  OrderPricingTargetTotalInvalidError,
} from '../errors/order.errors';

export type DraftOrderPricingItemProposal = {
  orderItemId: string;
  label: string;
  currency: string;
  basePrice: Decimal;
  currentFinalPrice: Decimal;
  proposedFinalPrice: Decimal;
  proposedDiscountAmount: Decimal;
};

export type DraftOrderPricingProposal = {
  currency: string;
  currentItemsSubtotal: Decimal;
  targetTotal: Decimal;
  proposedDiscountTotal: Decimal;
  items: DraftOrderPricingItemProposal[];
};

export type DraftOrderPricingItemUpdate = {
  orderItemId: string;
  finalPrice: string;
};

export type DraftOrderPricingAllocationItem = {
  orderItemId: string;
  currentFinalPrice: Decimal;
};

type DraftPricingItem = {
  orderItemId: string;
  label: string;
  basePrice: Decimal;
  currentFinalPrice: Decimal;
};

@Injectable()
export class DraftOrderPricingService {
  proposeTargetTotal(order: Order, targetTotal: Decimal): DraftOrderPricingProposal {
    const items = this.getDraftPricingItems(order);
    const currentItemsSubtotal = items.reduce((sum, item) => sum.plus(item.currentFinalPrice), new Decimal(0));
    const currency = order.currentFinancialSnapshot.currency;

    this.assertValidTargetTotal(targetTotal);

    const proposedFinals = allocateTargetTotal(items, targetTotal);
    const proposedDiscountTotal = currentItemsSubtotal.minus(targetTotal);

    return {
      currency,
      currentItemsSubtotal,
      targetTotal,
      proposedDiscountTotal,
      items: items.map((item, index) => ({
        orderItemId: item.orderItemId,
        label: item.label,
        currency,
        basePrice: item.basePrice,
        currentFinalPrice: item.currentFinalPrice,
        proposedFinalPrice: proposedFinals[index],
        proposedDiscountAmount: item.currentFinalPrice.minus(proposedFinals[index]),
      })),
    };
  }

  buildFinalPriceMapFromTargetTotal(order: Order, targetTotal: Decimal): Map<string, Decimal> {
    const proposal = this.proposeTargetTotal(order, targetTotal);

    return new Map(proposal.items.map((item) => [item.orderItemId, item.proposedFinalPrice]));
  }

  buildFinalPriceMapFromTargetTotalItems(
    items: DraftOrderPricingAllocationItem[],
    targetTotal: Decimal,
  ): Map<string, Decimal> {
    this.assertValidTargetTotal(targetTotal);

    const allocationItems = items.map((item) => ({
      orderItemId: item.orderItemId,
      label: item.orderItemId,
      basePrice: item.currentFinalPrice,
      currentFinalPrice: item.currentFinalPrice,
    }));
    const proposedFinals = allocateTargetTotal(allocationItems, targetTotal);

    return new Map(allocationItems.map((item, index) => [item.orderItemId, proposedFinals[index]]));
  }

  buildFinalPriceMapFromItems(order: Order, updates: DraftOrderPricingItemUpdate[]): Map<string, Decimal> {
    const items = this.getDraftPricingItems(order);
    const itemsById = new Map(items.map((item) => [item.orderItemId, item]));

    if (updates.length !== items.length) {
      throw new OrderPricingItemsPayloadMismatchError();
    }

    const seen = new Set<string>();
    const finalPriceByItemId = new Map<string, Decimal>();

    for (const update of updates) {
      if (seen.has(update.orderItemId)) {
        throw new OrderPricingItemsPayloadMismatchError();
      }

      const item = itemsById.get(update.orderItemId);
      if (!item) {
        throw new OrderPricingItemNotFoundError(update.orderItemId);
      }

      const finalPrice = new Decimal(update.finalPrice);
      if (finalPrice.isNegative()) {
        throw new OrderPricingItemFinalPriceInvalidError(update.orderItemId, update.finalPrice);
      }

      seen.add(update.orderItemId);
      finalPriceByItemId.set(update.orderItemId, finalPrice.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
    }

    for (const item of items) {
      if (!seen.has(item.orderItemId)) {
        throw new OrderPricingItemsPayloadMismatchError();
      }
    }

    return finalPriceByItemId;
  }

  private getDraftPricingItems(order: Order): DraftPricingItem[] {
    return order.getItems().map((item) => ({
      orderItemId: item.id,
      label: item.isProduct() ? item.productTypeId! : item.bundleSnapshot!.bundleName,
      basePrice: item.calculatedPriceSnapshot.basePrice,
      currentFinalPrice: item.effectiveFinalPrice,
    }));
  }

  private assertValidTargetTotal(targetTotal: Decimal): void {
    if (targetTotal.lte(0)) {
      throw new OrderPricingTargetTotalInvalidError(targetTotal.toFixed(2));
    }
  }
}

function allocateTargetTotal(items: DraftPricingItem[], targetTotal: Decimal): Decimal[] {
  const currentTotal = items.reduce((sum, item) => sum.plus(item.currentFinalPrice), new Decimal(0));
  if (items.length === 0) {
    return [];
  }

  if (currentTotal.isZero()) {
    const equalShare = targetTotal.div(items.length).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const rounded = items.map(() => equalShare);
    const roundedTotal = rounded.reduce((sum, value) => sum.plus(value), new Decimal(0));
    const remainder = targetTotal.minus(roundedTotal);

    if (!remainder.isZero()) {
      rounded[0] = rounded[0].plus(remainder).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    }

    return rounded;
  }

  const scale = targetTotal.div(currentTotal);
  const rounded = items.map((item) => item.currentFinalPrice.mul(scale).toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
  const roundedTotal = rounded.reduce((sum, value) => sum.plus(value), new Decimal(0));
  const remainder = targetTotal.minus(roundedTotal);

  if (!remainder.isZero()) {
    const remainderTargetIndex = items.reduce((selectedIndex, item, index, source) => {
      if (selectedIndex === -1) {
        return index;
      }

      return item.currentFinalPrice.gt(source[selectedIndex].currentFinalPrice) ? index : selectedIndex;
    }, -1);

    rounded[remainderTargetIndex] = rounded[remainderTargetIndex]
      .plus(remainder)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  return rounded;
}
