import type { ProductDetailDto, PricingTierDetail } from "@repo/schemas";
import type { TenantResponseDto } from "@repo/schemas";

interface PricingTabProps {
  product: ProductDetailDto;
  tenant: TenantResponseDto;
}

// ---------------------------------------------------------------------------
// Pricing summary derivation
//
// For each of the tenant's billing units, find the product-level base tier
// (inventoryItemId === null, fromUnit === 1). This gives the base rate per
// billing unit type, which is what the summary card displays.
// ---------------------------------------------------------------------------

interface PricingSummaryEntry {
  billingUnitName: string;
  pricePerUnit: number;
  currency: string;
}

function derivePricingSummary(
  product: ProductDetailDto,
  tenant: TenantResponseDto,
): PricingSummaryEntry[] {
  const productLevelTiers = product.pricingTiers.filter(
    (t) => t.inventoryItemId === null,
  );

  return tenant.billingUnits
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((unit) => {
      const baseTier = productLevelTiers.find(
        (t) => t.billingUnit.id === unit.id && t.fromUnit === 1,
      );
      if (!baseTier) return [];
      return [
        {
          billingUnitName: unit.name,
          pricePerUnit: baseTier.pricePerUnit,
          currency: baseTier.currency,
        },
      ];
    });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingTab({ product, tenant }: PricingTabProps) {
  const summary = derivePricingSummary(product, tenant);

  const productTiers = product.pricingTiers.filter(
    (t) => t.inventoryItemId === null,
  );
  const itemOverrideTiers = product.pricingTiers.filter(
    (t) => t.inventoryItemId !== null,
  );

  return (
    <div className="space-y-8">
      {/* Summary card */}
      {summary.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Pricing Summary
          </h3>
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {summary.map((entry) => (
                <div key={entry.billingUnitName} className="space-y-1">
                  <p className="text-xs text-muted-foreground capitalize">
                    {entry.billingUnitName.replace(/_/g, " ")} rate
                  </p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCurrency(entry.pricePerUnit, entry.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product-level tiers */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Product Tiers
        </h3>
        <PricingTiersTable tiers={productTiers} />
      </section>

      {/* Item-level override tiers */}
      {itemOverrideTiers.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Item Override Tiers
          </h3>
          <PricingTiersTable tiers={itemOverrideTiers} showItemColumn />
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiers table
// ---------------------------------------------------------------------------

interface PricingTiersTableProps {
  tiers: PricingTierDetail[];
  showItemColumn?: boolean;
}

function PricingTiersTable({ tiers, showItemColumn }: PricingTiersTableProps) {
  if (tiers.length === 0) {
    return <p className="text-sm text-muted-foreground">No tiers defined.</p>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Billing Unit
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              From Unit
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Price / Unit
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Currency
            </th>
            {showItemColumn && (
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Item ID
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {tiers.map((tier) => (
            <tr key={tier.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium capitalize">
                {tier.billingUnit.name.replace(/_/g, " ")}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                {tier.fromUnit}
              </td>
              <td className="px-4 py-3 tabular-nums font-medium">
                {formatCurrency(tier.pricePerUnit, tier.currency)}
              </td>
              <td className="px-4 py-3 text-muted-foreground uppercase">
                {tier.currency}
              </td>
              {showItemColumn && (
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {tier.inventoryItemId}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
