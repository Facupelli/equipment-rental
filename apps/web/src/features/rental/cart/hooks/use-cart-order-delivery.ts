import { FulfillmentMethod } from "@repo/types";
import { useMemo, useState } from "react";
import {
	EMPTY_DELIVERY_REQUEST,
	type DeliveryRequestField,
	type DeliveryRequestFormState,
} from "../cart-order.types";
import { normalizeDeliveryRequest } from "../cart-order.utils";

export function useCartOrderDelivery() {
	const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>(
		FulfillmentMethod.PICKUP,
	);
	const [deliveryRequest, setDeliveryRequest] =
		useState<DeliveryRequestFormState>(EMPTY_DELIVERY_REQUEST);
	const [isDeliveryDetailsRequired, setIsDeliveryDetailsRequired] =
		useState(false);

	const onFulfillmentMethodChange = (value: FulfillmentMethod) => {
		setFulfillmentMethod(value);
		if (value === FulfillmentMethod.PICKUP) {
			setIsDeliveryDetailsRequired(false);
		}
	};

	const onDeliveryRequestFieldChange = (
		field: DeliveryRequestField,
		value: string,
	) => {
		setDeliveryRequest((current) => ({ ...current, [field]: value }));
		setIsDeliveryDetailsRequired(false);
	};

	const normalizedDeliveryRequest = useMemo(
		() =>
			normalizeDeliveryRequest({
				deliveryRequest,
				fulfillmentMethod,
			}),
		[deliveryRequest, fulfillmentMethod],
	);

	return {
		fulfillmentMethod,
		deliveryRequest,
		normalizedDeliveryRequest,
		isDeliveryDetailsRequired,
		onFulfillmentMethodChange,
		onDeliveryRequestFieldChange,
		requireDeliveryDetails: () => setIsDeliveryDetailsRequired(true),
	};
}
