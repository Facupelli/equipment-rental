import { z } from "zod";
import { UserCreateSchema } from "../user/user.schema";
import { TenantCreateSchema } from "../tenant/tenant.schema";

export const CreateTenantUserSchema = z.object({
  user: UserCreateSchema,
  tenant: TenantCreateSchema,
});

export type TenantUserCreate = z.infer<typeof CreateTenantUserSchema>;

export interface CreaetTenantUserResponse {
  userId: string;
  tenantId: string;
}
