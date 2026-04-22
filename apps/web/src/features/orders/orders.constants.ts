import { OrderStatus } from "@repo/types";

export type StatusConfig = {
	label: string;
	className: string;
};

export const ORDER_STATUS_MAP: Record<OrderStatus, StatusConfig> = {
	[OrderStatus.PENDING_REVIEW]: {
		label: "Pendiente Revisión",
		className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
	},
	[OrderStatus.CONFIRMED]: {
		label: "Confirmado",
		className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
	},
	[OrderStatus.REJECTED]: {
		label: "Rechazado",
		className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
	},
	[OrderStatus.EXPIRED]: {
		label: "Expirado",
		className: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
	},
	[OrderStatus.ACTIVE]: {
		label: "En Alquiler",
		className: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
	},
	[OrderStatus.COMPLETED]: {
		label: "Completado",
		className: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
	},
	[OrderStatus.CANCELLED]: {
		label: "Cancelado",
		className: "bg-red-50 text-red-600 ring-1 ring-red-200",
	},
};
