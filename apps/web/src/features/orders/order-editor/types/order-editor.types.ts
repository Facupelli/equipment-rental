import type { OrderStatus } from "@repo/types";
import type { DraftOrderState } from "@/features/orders/draft-order/types/draft-order.types";

export type OrderEditorMode =
	| "create-draft"
	| "edit-draft"
	| "edit-pending-review"
	| "edit-confirmed";

export type OrderEditorState = DraftOrderState;

export type OrderEditAvailability =
	| { canEdit: true; mode: OrderEditorMode }
	| {
			canEdit: false;
			reason: "unsupported-status" | "pickup-started" | "signed";
	  };

export type EditableOrderStatus = Extract<
	OrderStatus,
	OrderStatus.DRAFT | OrderStatus.PENDING_REVIEW | OrderStatus.CONFIRMED
>;
