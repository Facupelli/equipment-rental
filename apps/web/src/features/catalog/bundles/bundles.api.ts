import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  type BundleListItemResponseDto,
  type PaginatedDto,
  type GetBundlesQueryDto,
  type CreateBundleDto,
  CreateBundleSchema,
  GetBundlesQuerySchema,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/bundles";

export const createBundle = createServerFn({ method: "POST" })
  .inputValidator((data: CreateBundleDto) => CreateBundleSchema.parse(data))
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export const getBundles = createServerFn({ method: "GET" })
  .inputValidator((data: GetBundlesQueryDto) =>
    GetBundlesQuerySchema.parse(data),
  )
  .handler(
    async ({ data }): Promise<PaginatedDto<BundleListItemResponseDto>> => {
      const result = await apiFetchPaginated<BundleListItemResponseDto>(
        apiUrl,
        {
          method: "GET",
          params: data,
        },
      );

      return result;
    },
  );
