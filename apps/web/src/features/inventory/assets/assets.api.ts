import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  AssetCreateSchema,
  GetAssetsQuerySchema,
  type AssetCreate,
  type AssetResponse,
  type GetAssetsQuery,
  type PaginatedDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/assets";

export const createAsset = createServerFn({ method: "POST" })
  .inputValidator((data: AssetCreate) => AssetCreateSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getAssets = createServerFn({ method: "GET" })
  .inputValidator((data: GetAssetsQuery) => GetAssetsQuerySchema.parse(data))
  .handler(async ({ data }): Promise<PaginatedDto<AssetResponse>> => {
    const result = await apiFetchPaginated<AssetResponse>(apiUrl, {
      method: "GET",
      params: data,
    });

    return result;
  });
