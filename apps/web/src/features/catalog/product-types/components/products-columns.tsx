import { Badge } from "@/components/ui/badge";
import type { ProductTypeResponse } from "@repo/schemas";
import type { ColumnDef } from "@tanstack/react-table";

// ---------------------------------------------------------------------------
// Tracking type formatting
// ---------------------------------------------------------------------------

const TRACKING_MODE_LABELS: Record<string, string> = {
  SERIALIZED: "Serialized",
  POOLED: "Pooled",
  NONE: "None",
  // Extend as TrackingType enum grows
} as const;

export function formatTrackingType(value: string): string {
  return (
    TRACKING_MODE_LABELS[value] ??
    value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export const productColumns: ColumnDef<ProductTypeResponse>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue<string>()}</span>
    ),
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category;
      return category ? (
        <Badge variant="secondary">{category.name}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    id: "trackingMode",
    accessorKey: "trackingMode",
    header: "Tracking Mode",
    cell: ({ getValue }) => (
      <span className="text-sm">{formatTrackingType(getValue<string>())}</span>
    ),
  },
  {
    id: "totalAssets",
    // TODO: replace with real accessor once backend exposes this field
    accessorFn: () => 0,
    header: "Total Assets",
    cell: ({ getValue }) => (
      <span className="tabular-nums text-sm">{getValue<number>()}</span>
    ),
  },
];
