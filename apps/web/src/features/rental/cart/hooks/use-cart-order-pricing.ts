import type { CartPriceResult } from "@repo/schemas";
import { useMemo } from "react";
import { useCartPricePreview } from "@/features/rental/rental.queries";
import { fromDateParam } from "@/lib/dates/parse";
import type { CartItem } from "../cart.types";
import type { CartOrderPeriod } from "../cart-order.types";
import {
	buildCartOrderItemPayload,
	buildCartPricePreviewRequest,
	joinCartLineItems,
} from "../cart-order.utils";

type UseCartOrderPricingParams = {
	locationId: string;
	pickupDate: string;
	returnDate: string;
	insuranceSelected: boolean;
	cartItems: CartItem[];
};

export function useCartOrderPricing({
	locationId,
	pickupDate,
	returnDate,
	insuranceSelected,
	cartItems,
}: UseCartOrderPricingParams) {
	const period: CartOrderPeriod = useMemo(
		() => ({
			start: fromDateParam(pickupDate),
			end: fromDateParam(returnDate),
		}),
		[pickupDate, returnDate],
	);

	const itemPayload = useMemo(
		() => buildCartOrderItemPayload(cartItems),
		[cartItems],
	);

	const pricePreviewRequest = useMemo(
		() =>
			buildCartPricePreviewRequest({
				locationId,
				pickupDate,
				returnDate,
				itemPayload,
				insuranceSelected,
			}),
		[pickupDate, returnDate, insuranceSelected, itemPayload, locationId],
	);

	const {
		data: breakdown,
		isPending: isPriceLoading,
		isError: isPriceError,
	} = useCartPricePreview<CartPriceResult>(pricePreviewRequest, {
		enabled: Boolean(pickupDate && returnDate && locationId),
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
