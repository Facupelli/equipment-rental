import dayjs from "@/lib/dates/dayjs";
import type { ScheduleRoute } from "@/routes/_admin/dashboard/schedule";

export function useScheduleParams(Route: ScheduleRoute, timezone: string) {
  const { date, orderId } = Route.useSearch();
  const navigate = Route.useNavigate();

  const today = dayjs().tz(timezone).format("YYYY-MM-DD");
  const selectedDate = date ?? today;
  const isToday = selectedDate === today;

  const d = dayjs(selectedDate, "YYYY-MM-DD");
  const monthFrom = d.startOf("month").format("YYYY-MM-DD");
  const monthTo = d.endOf("month").format("YYYY-MM-DD");

  const setDate = (d: Date) => {
    navigate({
      search: (prev) => ({
        ...prev,
        date: dayjs(d).format("YYYY-MM-DD"),
        orderId: undefined, // clear panel when changing date
      }),
    });
  };

  const setOrderId = (id: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, orderId: id }) });
  };

  return {
    selectedDate,
    isToday,
    monthFrom,
    monthTo,
    selectedOrderId: orderId,
    setDate,
    setOrderId,
  };
}
