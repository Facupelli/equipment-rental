import { apiFetch } from "@/lib/api";
import {
  updateTenantConfigSchema,
  type TenantResponse,
  type UpdateTenantConfigDto,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/tenants";

export const getCurrentTenant = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantResponse | null> => {
    const result = await apiFetch<TenantResponse>(`${apiUrl}/me`, {
      method: "GET",
    });

    return result;
  },
);

export const updateTenantConfig = createServerFn({ method: "POST" })
  .inputValidator((data: UpdateTenantConfigDto) =>
    updateTenantConfigSchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(`${apiUrl}/config`, {
      method: "PATCH",
      body: data,
    });

    return result;
  });
