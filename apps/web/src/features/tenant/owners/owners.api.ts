import { apiFetch } from "@/lib/api";
import {
  OwnerCreateSchema,
  type OwnerCreate,
  type OwnerListResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/owners";

export const createOwner = createServerFn({ method: "POST" })
  .inputValidator((data: OwnerCreate) => OwnerCreateSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getOwners = createServerFn({ method: "GET" }).handler(
  async (): Promise<OwnerListResponse> => {
    const result = await apiFetch<OwnerListResponse>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
