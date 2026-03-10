import { createFileRoute } from "@tanstack/react-router";
import {
  handleRequest,
  route,
  type Router,
  RejectUpload,
} from "@better-upload/server";
import { cloudflare } from "@better-upload/server/clients";
import { getCurrentTenant } from "@/features/tenant/tenant.api";

const s3 = cloudflare({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
});

const uploadRouter: Router = {
  client: s3,
  bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
  routes: {
    catalogImages: route({
      fileTypes: ["image/webp"],
      maxFileSize: 1024 * 1024 * 3, // 3MB after client-side compression
      onBeforeUpload: async () => {
        const tenant = await getCurrentTenant();

        if (!tenant) {
          throw new RejectUpload("Unauthorized");
        }

        const key = `${tenant.id}/catalog/${crypto.randomUUID()}.webp`;

        return {
          objectInfo: { key },
          metadata: { key }, // echoed back to client after upload
        };
      },
    }),
  },
};

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => handleRequest(request, uploadRouter),
    },
  },
});
