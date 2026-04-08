import { OrderStatus } from "@repo/types";

export type StatusConfig = {
	label: string;
	className: string;
};

export const ORDER_STATUS_MAP: Record<OrderStatus, StatusConfig> = {
	[OrderStatus.PENDING_REVIEW]: {
		label: "Pending Review",
		className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
	},
	[OrderStatus.CONFIRMED]: {
		label: "Confirmed",
		className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
	},
	[OrderStatus.REJECTED]: {
		label: "Rejected",
		className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
	},
	[OrderStatus.EXPIRED]: {
		label: "Expired",
		className: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
	},
	[OrderStatus.ACTIVE]: {
		label: "Out",
		className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
	},
	[OrderStatus.COMPLETED]: {
		label: "Completed",
		className: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
	},
	[OrderStatus.CANCELLED]: {
		label: "Cancelled",
		className: "bg-red-50 text-red-600 ring-1 ring-red-200",
	},
};
