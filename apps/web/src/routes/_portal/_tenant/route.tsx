import { rentalTenantQueries } from "@/features/rental/tenant/tenant.queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_portal/_tenant")({
  beforeLoad: async () => {
    // const { accessToken } = await ensureValidSession({
    //   data: context.tenantContext.face,
    // });
    // return { accessToken };
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(rentalTenantQueries.me());
  },
});
