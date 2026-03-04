import { Badge } from "@/components/ui/badge";
import type { InventoryItemDetail, ProductDetailDto } from "@repo/schemas";
import { TrackingType, InventoryItemStatus } from "@repo/types";

interface PhysicalItemsTabProps {
  product: ProductDetailDto;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  InventoryItemStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  OPERATIONAL: { label: "Available", variant: "default" },
  MAINTENANCE: { label: "In Maintenance", variant: "secondary" },
  RETIRED: { label: "Retired", variant: "destructive" },
};

function StatusBadge({ status }: { status: InventoryItemStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "outline" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhysicalItemsTab({ product }: PhysicalItemsTabProps) {
  const isSerialized = product.trackingType === TrackingType.SERIALIZED;
  const items = product.inventoryItems;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {isSerialized ? "Serialized Units" : "Stock Items"}{" "}
          <span className="ml-1 text-foreground">({items.length})</span>
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No inventory items found.
        </p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {isSerialized ? (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Serial Number
                  </th>
                ) : (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Quantity
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Location
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Owner
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <PhysicalItemRow
                  key={item.id}
                  item={item}
                  isSerialized={isSerialized}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

interface PhysicalItemRowProps {
  item: InventoryItemDetail;
  isSerialized: boolean;
}

function PhysicalItemRow({ item, isSerialized }: PhysicalItemRowProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(item.createdAt));

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      {isSerialized ? (
        <td className="px-4 py-3 font-mono text-xs">
          {item.serialNumber ?? (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      ) : (
        <td className="px-4 py-3 tabular-nums font-medium">
          {item.totalQuantity}
        </td>
      )}
      <td className="px-4 py-3">
        <StatusBadge status={item.status as InventoryItemStatus} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{item.location.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{item.owner.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{formattedDate}</td>
    </tr>
  );
}
