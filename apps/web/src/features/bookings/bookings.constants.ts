export type StatusConfig = {
  label: string;
  className: string;
};

export const STATUS_MAP: Record<string, StatusConfig> = {
  PENDING_CONFIRMATION: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  RESERVED: {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  ACTIVE: {
    label: "Out",
    className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-50 text-red-600 ring-1 ring-red-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-50 text-red-600 ring-1 ring-red-200",
  },
};
