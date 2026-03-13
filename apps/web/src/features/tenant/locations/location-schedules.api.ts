import { apiFetch } from "@/lib/api";
import {
  addScheduleToLocationSchema,
  type AddScheduleToLocationDto,
  type LocationScheduleResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

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
      dto: addScheduleToLocationSchema.parse(data.dto),
    }),
  )
  .handler(async ({ data }): Promise<LocationScheduleResponseDto> => {
    return apiFetch<LocationScheduleResponseDto>(apiUrl(data.locationId), {
      method: "POST",
      body: data.dto,
    });
  });

export const bulkCreateLocationSchedules = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { locationId: string; items: AddScheduleToLocationDto[] }) => ({
      locationId: data.locationId,
      items: z.array(addScheduleToLocationSchema).parse(data.items),
    }),
  )
  .handler(async ({ data }): Promise<LocationScheduleResponseDto[]> => {
    return apiFetch<LocationScheduleResponseDto[]>(
      `${apiUrl(data.locationId)}/bulk`,
      {
        method: "POST",
        body: { items: data.items },
      },
    );
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
      dto: addScheduleToLocationSchema.parse(data.dto),
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
