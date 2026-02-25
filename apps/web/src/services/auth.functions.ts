import { createServerFn } from "@tanstack/react-start";
import {
  type CreateTenantUserDto,
  type RegisterResponseDto,
  createTenantUserSchema,
} from "@repo/schemas";
import { apiFetch, type ApiResult } from "@/lib/api";

export const registerTenantUser = createServerFn({ method: "POST" })
  .inputValidator((data: CreateTenantUserDto) =>
    createTenantUserSchema.parse(data),
  )
  .handler(async ({ data }): Promise<ApiResult<RegisterResponseDto>> => {
    const result = await apiFetch<RegisterResponseDto>("/tenancy/register", {
      method: "POST",
      body: data,
    });

    // Validate the success payload shape before returning to client
    if (result.success) {
      return { success: true, data: result.data };
    }

    return result;
  });
