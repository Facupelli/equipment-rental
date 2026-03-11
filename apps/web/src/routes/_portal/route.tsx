import { getCurrentUser } from "@/features/auth/auth.api";
import { ensureValidSession } from "@/features/auth/get-session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_portal")({
  beforeLoad: async ({ context }) => {
    // const { accessToken } = await ensureValidSession({
    //   data: context.tenantContext.face,
    // });
    // return { accessToken };
  },
  loader: async () => {
    // const user = await getCurrentUser();
    // if (!user) {
    //   throw Error("User or  not found");
    // }
    // return { user };
  },
});
