import { OrderDetailResponseDto as OrderDetailResponse } from '@repo/schemas';

export type GetOrderByIdResponseDto = OrderDetailResponse & {
  financial: OrderDetailResponse['financial'] & {
    itemsSubtotal: string;
    subtotalBeforeDiscounts: string;
    itemsDiscountTotal: string;
    insuranceApplied: boolean;
    insuranceAmount: string;
  };
};
