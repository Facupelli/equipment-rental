import dayjs from "dayjs";
import {
	getOrderOperationalPhase,
	type OrderOperationalPhase,
} from "@/features/orders/order.utils";
import type { ParsedOrderListItem } from "@/features/orders/orders.queries";

const ORDER_OPERATIONAL_PHASE_MAP: Record<
	OrderOperationalPhase,
	{ label: string; className: string }
> = {
	draft: {
		label: "Borrador",
		className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
	},
	pending: {
		label: "Pendiente",
		className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
	},
	active: {
		label: "Activo",
		className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
	},
	returned: {
		label: "Devuelto",
		className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
	},
	cancelled: {
		label: "Cancelado",
		className: "bg-red-50 text-red-600 ring-1 ring-red-200",
	},
	rejected: {
		label: "Rechazado",
		className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
	},
	expired: {
		label: "Expirado",
		className: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
	},
};

export function OrderOperationalPhaseBadge({
	order,
}: {
	order: Pick<ParsedOrderListItem, "status" | "pickupAt" | "returnAt">;
}) {
	const phase = getOrderOperationalPhase(order, dayjs());
	const config = ORDER_OPERATIONAL_PHASE_MAP[phase];

	return (
		<span
			className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${config.className}`}
		>
			{config.label}
		</span>
	);
}
