import { OrderStatus } from "@repo/types";
import { ORDER_STATUS_MAP } from "../orders.constants";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
	const config = ORDER_STATUS_MAP[status] ?? ORDER_STATUS_MAP.ACTIVE;
	return (
		<span
			className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${config.className}`}
		>
			{config.label}
		</span>
	);
}
