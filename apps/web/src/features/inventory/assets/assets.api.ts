import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  createAssetSchema,
  getAssetsQuerySchema,
  type AssetResponse,
  type CreateAssetDto,
  type GetAssetsQuery,
  type PaginatedDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/assets";

export const createAsset = createServerFn({ method: "POST" })
  .inputValidator((data: CreateAssetDto) => createAssetSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getAssets = createServerFn({ method: "GET" })
  .inputValidator((data: GetAssetsQuery) => getAssetsQuerySchema.parse(data))
  .handler(async ({ data }): Promise<PaginatedDto<AssetResponse>> => {
    const result = await apiFetchPaginated<AssetResponse>(apiUrl, {
      method: "GET",
      params: data,
    });

    return result;
  });
