import { apiFetch } from "@/lib/api";
import {
  AddScheduleToLocationSchema,
  type AddScheduleToLocationDto,
  type LocationScheduleResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = (locationId: string) => `/locations/${locationId}/schedules`;

// ---------------------------------------------------------------------------

export const getLocationSchedules = createServerFn({ method: "GET" })
  .inputValidator((data: { locationId: string }) => data)
  .handler(async ({ data }): Promise<LocationScheduleResponseDto[]> => {
    return apiFetch<LocationScheduleResponseDto[]>(apiUrl(data.locationId), {
      method: "GET",
    });
  });

// ---------------------------------------------------------------------------

export const createLocationSchedule = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { locationId: string; dto: AddScheduleToLocationDto }) => ({
      locationId: data.locationId,
      dto: AddScheduleToLocationSchema.parse(data.dto),
    }),
  )
  .handler(async ({ data }): Promise<LocationScheduleResponseDto> => {
    return apiFetch<LocationScheduleResponseDto>(apiUrl(data.locationId), {
      method: "POST",
      body: data.dto,
    });
  });

// ---------------------------------------------------------------------------

export const updateLocationSchedule = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      locationId: string;
      scheduleId: string;
      dto: AddScheduleToLocationDto;
    }) => ({
      locationId: data.locationId,
      scheduleId: data.scheduleId,
      dto: AddScheduleToLocationSchema.parse(data.dto),
    }),
  )
  .handler(async ({ data }): Promise<LocationScheduleResponseDto> => {
    return apiFetch<LocationScheduleResponseDto>(
      `${apiUrl(data.locationId)}/${data.scheduleId}`,
      {
        method: "PATCH",
        body: data.dto,
      },
    );
  });
