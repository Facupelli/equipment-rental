CREATE TYPE "CustomDomainStatus" AS ENUM ('PENDING', 'ACTIVE', 'ACTION_REQUIRED', 'FAILED');

CREATE TABLE "custom_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "cf_hostname_id" TEXT,
    "status" "CustomDomainStatus" NOT NULL,
    "verified_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_domains_tenant_id_key" ON "custom_domains"("tenant_id");
CREATE UNIQUE INDEX "custom_domains_domain_key" ON "custom_domains"("domain");

ALTER TABLE "custom_domains"
ADD CONSTRAINT "custom_domains_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
