import { apiFetch } from "@/lib/api";
import {
  SyncTenantBillingUnitsSchema,
  type SyncTenantBillingUnits,
  type TenantBillingUnitListResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/tenants/billing-units";

export const getTenantBillingUnits = createServerFn({ method: "GET" }).handler(
  async (): Promise<TenantBillingUnitListResponse> => {
    const result = await apiFetch<TenantBillingUnitListResponse>(apiUrl, {
      method: "GET",
    });

    return result;
  },
);

export const createTenantBillingUnit = createServerFn({ method: "POST" })
  .inputValidator((data: SyncTenantBillingUnits) =>
    SyncTenantBillingUnitsSchema.parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    const result = await apiFetch<string>(apiUrl, {
      method: "POST",
      body: data,
    });

    return result;
  });
