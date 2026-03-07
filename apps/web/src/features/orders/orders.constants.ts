import { OrderStatus } from "@repo/types";

export type StatusConfig = {
  label: string;
  className: string;
};

export const STATUS_MAP: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.PENDING_SOURCING]: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  [OrderStatus.SOURCED]: {
    label: "Sourced",
    className: "bg-green-50 text-green-600 ring-1 ring-green-200",
  },
  [OrderStatus.CONFIRMED]: {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
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
