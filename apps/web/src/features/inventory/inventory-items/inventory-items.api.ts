import { apiFetch } from "@/lib/api";
import {
  createInventoryItemSchema,
  type CreateInventoryItemDto,
  type InventoryItemResponseDto,
} from "@repo/schemas";
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

export const getInventoryItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<InventoryItemResponseDto[]> => {
    const result = await apiFetch<InventoryItemResponseDto[]>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);
