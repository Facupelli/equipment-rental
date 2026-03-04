import type { ProductTypeResponse } from "@repo/schemas";

interface SpecificationsTabProps {
  product: ProductTypeResponse;
}

export function SpecificationsTab({ product }: SpecificationsTabProps) {
  const attributeEntries = Object.entries(product.attributes);
  const includedItems = product.includedItems;

  return (
    <div className="space-y-8">
      {/* Attributes */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Specifications
        </h3>

        {attributeEntries.length > 0 ? (
          <div className="rounded-md border divide-y">
            {attributeEntries.map(([key, value]) => (
              <div key={key} className="flex px-4 py-3 text-sm">
                <span className="w-48 shrink-0 font-medium capitalize text-muted-foreground">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-foreground">
                  {value === null || value === undefined ? "—" : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No specifications defined.
          </p>
        )}
      </section>

      {/* Included items */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Included Items
        </h3>

        {includedItems.length > 0 ? (
          <div className="rounded-md border divide-y">
            {includedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium">{item.name}</span>
                {item.quantity && (
                  <span className="text-muted-foreground">
                    × {item.quantity}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No included items.</p>
        )}
      </section>
    </div>
  );
}
