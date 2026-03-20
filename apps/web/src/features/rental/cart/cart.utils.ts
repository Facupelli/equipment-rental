import dayjs from "@/lib/dates/dayjs";

export const formatCurrency = (
  amount: number,
  currency: string = "ARS",
): string =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amount);

export const formatSlot = (minutes: number): string =>
  dayjs().startOf("day").add(minutes, "minute").format("h:mm A");
