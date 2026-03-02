import { GetTodayOverviewResponse, GetUpcomingScheduleResponse } from '@repo/schemas';

export abstract class OrdersQueryPort {
  /**
   * Returns today's operational snapshot for the given tenant:
   * pick-up and return counts, scheduled out list, and due back list.
   *
   * @param tenantTimezone - IANA timezone string (e.g. "America/New_York").
   *                         Resolved by the application layer before calling this port.
   *                         Used to cast UTC tstzrange bounds to the tenant's local date.
   */
  abstract getTodayOverview(tenantId: string, tenantTimezone: string): Promise<GetTodayOverviewResponse>;

  /**
   * Returns bookings grouped by start date for the next 7 days (tomorrow → today + 7).
   * Days with no bookings are omitted from the result.
   *
   * @param tenantId       - Row-level security scope.
   * @param tenantTimezone - IANA timezone string. Same contract as getTodayOverview.
   */
  abstract getUpcomingSchedule(tenantId: string, tenantTimezone: string): Promise<GetUpcomingScheduleResponse>;
}
