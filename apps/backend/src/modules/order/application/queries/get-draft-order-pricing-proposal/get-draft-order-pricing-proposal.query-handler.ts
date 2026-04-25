import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DraftOrderPricingProposalResponseDto } from '@repo/schemas';
import Decimal from 'decimal.js';

import {
  DraftOrderPricingProposal,
  DraftOrderPricingService,
} from 'src/modules/order/domain/services/draft-order-pricing.service';
import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';

import { GetDraftOrderPricingProposalQuery } from './get-draft-order-pricing-proposal.query';
import { GetDraftOrderPricingProposalResponseDto } from './get-draft-order-pricing-proposal.response.dto';
import {
  OrderNotFoundError,
  OrderPricingAdjustmentNotAllowedError,
  OrderPricingTargetTotalInvalidError,
} from '../../../domain/errors/order.errors';
import { OrderStatus } from '@repo/types';

export type GetDraftOrderPricingProposalError =
  | OrderNotFoundError
  | OrderPricingAdjustmentNotAllowedError
  | OrderPricingTargetTotalInvalidError;

@QueryHandler(GetDraftOrderPricingProposalQuery)
export class GetDraftOrderPricingProposalQueryHandler implements IQueryHandler<
  GetDraftOrderPricingProposalQuery,
  GetDraftOrderPricingProposalResponseDto | GetDraftOrderPricingProposalError
> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly draftOrderPricingService: DraftOrderPricingService,
  ) {}

  async execute(
    query: GetDraftOrderPricingProposalQuery,
  ): Promise<GetDraftOrderPricingProposalResponseDto | GetDraftOrderPricingProposalError> {
    const order = await this.orderRepository.load(query.orderId, query.tenantId);

    if (!order) {
      return new OrderNotFoundError(query.orderId);
    }

    if (order.currentStatus !== OrderStatus.DRAFT) {
      return new OrderPricingAdjustmentNotAllowedError(order.currentStatus);
    }

    try {
      return toResponseDto(this.draftOrderPricingService.proposeTargetTotal(order, new Decimal(query.targetTotal)));
    } catch (error) {
      if (error instanceof OrderPricingTargetTotalInvalidError) {
        return error;
      }

      throw error;
    }
  }
}

function toResponseDto(proposal: DraftOrderPricingProposal): DraftOrderPricingProposalResponseDto {
  return {
    currency: proposal.currency,
    currentItemsSubtotal: proposal.currentItemsSubtotal.toFixed(2),
    targetTotal: proposal.targetTotal.toFixed(2),
    proposedDiscountTotal: proposal.proposedDiscountTotal.toFixed(2),
    items: proposal.items.map((item) => ({
      orderItemId: item.orderItemId,
      label: item.label,
      currency: item.currency,
      basePrice: item.basePrice.toFixed(2),
      currentFinalPrice: item.currentFinalPrice.toFixed(2),
      proposedFinalPrice: item.proposedFinalPrice.toFixed(2),
      proposedDiscountAmount: item.proposedDiscountAmount.toFixed(2),
    })),
  };
}
