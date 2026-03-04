import type { PricingTier, ProductTypeResponse } from "@repo/schemas";

interface PricingTabProps {
  product: ProductTypeResponse;
}

export function PricingTab({ product }: PricingTabProps) {
  const tiers = product.pricingTiers;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Pricing Tiers
        </h3>
        <PricingTiersTable tiers={tiers} />
      </section>
    </div>
  );
}

interface PricingTiersTableProps {
  tiers: PricingTier[];
}

function PricingTiersTable({ tiers }: PricingTiersTableProps) {
  if (tiers.length === 0) {
    return <p className="text-sm text-muted-foreground">No tiers defined.</p>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              From Unit
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              To Unit
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Price / Unit
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tiers.map((tier) => (
            <tr key={tier.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                {tier.fromUnit}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                {tier.toUnit ?? "—"}
              </td>
              <td className="px-4 py-3 tabular-nums font-medium">
                {tier.pricePerUnit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
