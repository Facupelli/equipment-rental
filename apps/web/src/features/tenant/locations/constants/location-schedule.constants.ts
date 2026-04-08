export const SLOT_INTERVAL_OPTIONS = [15, 30, 60] as const;
export type SlotInterval = (typeof SLOT_INTERVAL_OPTIONS)[number];

export const DAYS_OF_WEEK = [
	{ value: 1, label: "Every Monday" },
	{ value: 2, label: "Every Tuesday" },
	{ value: 3, label: "Every Wednesday" },
	{ value: 4, label: "Every Thursday" },
	{ value: 5, label: "Every Friday" },
	{ value: 6, label: "Every Saturday" },
	{ value: 0, label: "Every Sunday" },
] as const;

export const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0] as const;

export const DAY_LABELS: Record<number, string> = {
	0: "Sunday",
	1: "Monday",
	2: "Tuesday",
	3: "Wednesday",
	4: "Thursday",
	5: "Friday",
	6: "Saturday",
};
