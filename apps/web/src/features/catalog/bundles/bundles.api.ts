import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  type BundleListItemResponseDto,
  type PaginatedDto,
  type GetBundlesQueryDto,
  type CreateBundleDto,
  CreateBundleSchema,
  GetBundlesQuerySchema,
  type BundleDetailResponseDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

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

export interface GetBundleDetailParams {
  bundleId: string;
}

const bundleDetailParamsSchema = z.object({
  bundleId: z.uuid(),
});

export const getBundleDetail = createServerFn({ method: "GET" })
  .inputValidator((data: GetBundleDetailParams) =>
    bundleDetailParamsSchema.parse(data),
  )
  .handler(async ({ data }): Promise<BundleDetailResponseDto> => {
    const result = await apiFetch<BundleDetailResponseDto>(
      `${apiUrl}/${data.bundleId}`,
      {
        method: "GET",
      },
    );

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

export const publishBundle = createServerFn({ method: "POST" })
  .inputValidator((data: { bundleId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    await apiFetch<void>(`${apiUrl}/${data.bundleId}/publish`, {
      method: "PATCH",
    });
  });

export const retireBundle = createServerFn({ method: "POST" })
  .inputValidator((data: { bundleId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    await apiFetch<void>(`${apiUrl}/${data.bundleId}/retire`, {
      method: "PATCH",
    });
  });
