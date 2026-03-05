import { apiFetch } from "@/lib/api";
import {
  createLocationSchema,
  type CreateLocationDto,
  type LocationListResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/locations";

export const createLocation = createServerFn({ method: "POST" })
  .inputValidator((data: CreateLocationDto) => createLocationSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getLocations = createServerFn({ method: "GET" }).handler(
  async (): Promise<LocationListResponse> => {
    const result = await apiFetch<LocationListResponse>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
