import dayjs from "@/lib/dates/dayjs";

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export const formatSlot = (minutes: number): string =>
  dayjs().startOf("day").add(minutes, "minute").format("h:mm A");
