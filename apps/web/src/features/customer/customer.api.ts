import { apiFetchPaginated } from "@/lib/api";
import {
  getCustomersQuerySchema,
  type CustomerResponseDto,
  type GetCustomersQueryDto,
  type PaginatedDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/customers";

export const getCustomers = createServerFn({ method: "GET" })
  .inputValidator((data: GetCustomersQueryDto) =>
    getCustomersQuerySchema.parse(data),
  )
  .handler(async ({ data }): Promise<PaginatedDto<CustomerResponseDto>> => {
    console.log("CALLED");
    const result = await apiFetchPaginated<CustomerResponseDto>(apiUrl, {
      method: "GET",
      params: data,
    });

    return result;
  });
