import { useAssets } from "@/features/inventory/assets/assets.queries";
import { CreateAssetDialogForm } from "@/features/inventory/assets/components/create-asset-dialog-form";
import type { AssetResponse } from "@repo/schemas";
import { useProduct } from "./product-detail.context";

export function AssetsTab() {
  const {
    product: { id },
  } = useProduct();

  const { data: items, isPending } = useAssets({
    productTypeId: id,
  });

  if (isPending) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Units{" "}
          <span className="ml-1 text-foreground">
            ({items?.data.length ?? 0})
          </span>
        </h3>
      </div>

      <CreateAssetDialogForm />

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Serial Number
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
            {items === undefined || items.data.length === 0 ? (
              <tr className="border-b bg-muted/50">
                <td
                  colSpan={4}
                  className="px-4 py-3 text-center text-muted-foreground"
                >
                  No items found.
                </td>
              </tr>
            ) : (
              items.data.map((item) => (
                <PhysicalItemRow key={item.id} item={item} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PhysicalItemRowProps {
  item: AssetResponse;
}

function PhysicalItemRow({ item }: PhysicalItemRowProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(item.createdAt));

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-mono text-xs">
        {item.serialNumber ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{item.location.name}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.owner?.name ?? "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formattedDate}</td>
    </tr>
  );
}
