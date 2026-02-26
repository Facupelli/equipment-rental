import { apiFetch } from "@/lib/api";
import {
  CreateOwnerSchema,
  type CreateOwnerDto,
  type OwnerResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/owners";

export const createOwner = createServerFn({ method: "POST" })
  .inputValidator((data: CreateOwnerDto) => CreateOwnerSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getOwners = createServerFn({ method: "GET" }).handler(
  async (): Promise<OwnerResponseDto[]> => {
    const result = await apiFetch<OwnerResponseDto[]>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
