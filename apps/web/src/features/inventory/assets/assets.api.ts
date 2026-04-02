import { apiFetch, apiFetchPaginated } from "@/lib/api";
import { ProblemDetailsError } from "@/shared/errors";
import { type ProblemDetails } from "@repo/schemas";
import {
  createAssetSchema,
  getAssetsQuerySchema,
  type AssetResponseDto,
  type CreateAssetDto,
  type GetAssetsQuery,
  type PaginatedDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/assets";

export const createAsset = createServerFn({ method: "POST" })
  .inputValidator((data: CreateAssetDto) => createAssetSchema.parse(data))
  .handler(async ({ data }): Promise<string | { error: ProblemDetails }> => {
    try {
      const result = await apiFetch<string>(apiUrl, {
        method: "POST",
        body: data,
      });
      return result;
    } catch (error) {
      if (error instanceof ProblemDetailsError) {
        return { error: error.problemDetails }; // plain serializable object — crosses boundary safely
      }
      throw error; // genuine unexpected errors can still throw
    }
  });

export const getAssets = createServerFn({ method: "GET" })
  .inputValidator((data: GetAssetsQuery) => getAssetsQuerySchema.parse(data))
  .handler(async ({ data }): Promise<PaginatedDto<AssetResponseDto>> => {
    const result = await apiFetchPaginated<AssetResponseDto>(apiUrl, {
      method: "GET",
      params: data,
    });

    return result;
  });
