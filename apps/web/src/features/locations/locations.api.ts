import { apiFetch } from "@/lib/api";
import {
  CreateLocationSchema,
  type CreateLocationDto,
  type LocationResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/locations";

export const createLocation = createServerFn({ method: "POST" })
  .inputValidator((data: CreateLocationDto) => CreateLocationSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getLocations = createServerFn({ method: "GET" }).handler(
  async (): Promise<LocationResponseDto[]> => {
    const result = await apiFetch<LocationResponseDto[]>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
