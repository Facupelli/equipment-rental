import type { CartPriceResult } from "@repo/schemas";
import { useMemo } from "react";
import { useCartPricePreview } from "@/features/rental/rental.queries";
import { fromDate } from "@/lib/dates/parse";
import type { CartItem } from "../cart.types";
import type { CartOrderPeriod } from "../cart-order.types";
import {
	buildCartOrderItemPayload,
	buildCartPricePreviewRequest,
	joinCartLineItems,
} from "../cart-order.utils";

type UseCartOrderPricingParams = {
	locationId: string;
	startDate: Date;
	endDate: Date;
	insuranceSelected: boolean;
	cartItems: CartItem[];
};

export function useCartOrderPricing({
	locationId,
	startDate,
	endDate,
	insuranceSelected,
	cartItems,
}: UseCartOrderPricingParams) {
	const period: CartOrderPeriod = useMemo(
		() => ({ start: fromDate(startDate), end: fromDate(endDate) }),
		[startDate, endDate],
	);

	const itemPayload = useMemo(
		() => buildCartOrderItemPayload(cartItems),
		[cartItems],
	);

	const pricePreviewRequest = useMemo(
		() =>
			buildCartPricePreviewRequest({
				locationId,
				period,
				itemPayload,
				insuranceSelected,
			}),
		[insuranceSelected, itemPayload, locationId, period],
	);

	const {
		data: breakdown,
		isPending: isPriceLoading,
		isError: isPriceError,
	} = useCartPricePreview<CartPriceResult>(pricePreviewRequest, {
		enabled: Boolean(startDate && endDate && locationId),
	});

	const joinedLineItems = useMemo(
		() => joinCartLineItems({ lineItems: breakdown?.lineItems, cartItems }),
		[breakdown?.lineItems, cartItems],
	);

	return {
		period,
		itemPayload,
		breakdown,
		joinedLineItems,
		isPriceLoading,
		isPriceError,
	};
}
