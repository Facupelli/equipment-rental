import { DraftOrderComposerPage } from "@/features/orders/draft-order/components/draft-order-composer-page";
import type { OrderEditorMode } from "@/features/orders/order-editor/types/order-editor.types";

export function OrderEditorComposerPage({
	mode,
	orderId,
}: {
	mode: OrderEditorMode;
	orderId?: string;
}) {
	return <DraftOrderComposerPage mode={mode} orderId={orderId} />;
}
