import {
  handleRequest,
  RejectUpload,
  type Router,
  route,
} from "@better-upload/server";
import { cloudflare } from "@better-upload/server/clients";
import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "@/config/server-env";
import { getCurrentTenant } from "@/features/tenant/tenant.api";

const s3 = cloudflare({
  accountId: serverEnv.CLOUDFLARE_ACCOUNT_ID,
  accessKeyId: process.env.BRANDING_ACCESS_KEY_ID!,
  secretAccessKey: process.env.BRANDING_SECRET_ACCESS_KEY!,
});

const uploadRouter: Router = {
  client: s3,
  bucketName: serverEnv.CLOUDFLARE_R2_BRANDING_BUCKET_NAME,
  routes: {
    brandingLogo: route({
      fileTypes: ["image/webp"],
      maxFileSize: 1024 * 1024 * 3,
      onBeforeUpload: async () => {
        const tenant = await getCurrentTenant();

        if (!tenant) {
          throw new RejectUpload("Unauthorized");
        }

        const key = `${tenant.id}/logo/${crypto.randomUUID()}.webp`;

        return {
          objectInfo: { key },
          metadata: { key },
        };
      },
    }),
  },
};

export const Route = createFileRoute("/api/branding-upload" as never)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          return handleRequest(request, uploadRouter);
        } catch (error) {
          console.log(error);
          return new Response(
            JSON.stringify({ error: "Internal upload error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
