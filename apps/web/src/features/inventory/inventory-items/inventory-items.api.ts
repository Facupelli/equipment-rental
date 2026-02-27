import { apiFetch, apiFetchPaginated } from "@/lib/api";
import {
  createInventoryItemSchema,
  getInventoryItemsQuerySchema,
  type CreateInventoryItemDto,
  type InventoryItemListItemDto,
  type PaginatedDto,
} from "@repo/schemas";
import type { InventoryItemStatus } from "@repo/types";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/inventory-items";

export const createInventoryItem = createServerFn({ method: "POST" })
  .inputValidator((data: CreateInventoryItemDto) =>
    createInventoryItemSchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });

export interface GetInventoryItemsParams {
  search?: string;
  categoryId?: string;
  locationId?: string;
  status?: InventoryItemStatus;
  includeRetired?: boolean;
  page?: number;
  limit?: number;
}

export const getInventoryItems = createServerFn({ method: "GET" })
  .inputValidator((data: GetInventoryItemsParams) =>
    getInventoryItemsQuerySchema.parse(data),
  )
  .handler(
    async ({ data }): Promise<PaginatedDto<InventoryItemListItemDto>> => {
      const result = await apiFetchPaginated<InventoryItemListItemDto>(apiUrl, {
        method: "GET",
        params: data,
      });

      return result;
    },
  );
