import { Badge } from "@/components/ui/badge";
import type { BundleListItemResponseDto } from "@repo/schemas";
import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";

const col = createColumnHelper<BundleListItemResponseDto>();

export const bundleColumns = [
  col.accessor("name", {
    header: "Name",
    cell: (info) => (
      <div>
        <p className="font-semibold">{info.getValue()}</p>
        <p className="text-muted-foreground text-xs">
          {info.row.original.componentCount}{" "}
          {info.row.original.componentCount === 1 ? "item" : "items"}
        </p>
      </div>
    ),
  }),

  col.accessor("publishedAt", {
    id: "status",
    header: "Status",
    cell: (info) => {
      const publishedAt = info.getValue();
      const retiredAt = info.row.original.retiredAt;

      if (!publishedAt && !retiredAt) {
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Inactive
          </Badge>
        );
      }

      if (publishedAt && !retiredAt) {
        return (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            Active
          </Badge>
        );
      }

      if (publishedAt && retiredAt) {
        return (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            Retired
          </Badge>
        );
      }

      // Fallback (retired but not published - edge case)
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Inactive
        </Badge>
      );
    },
  }),

  col.accessor("billingUnit", {
    header: "Billing Unit",
    cell: (info) => (
      <span className="text-muted-foreground text-sm">
        {info.getValue().label}
      </span>
    ),
  }),

  col.accessor("basePrice", {
    header: "Price",
    cell: (info) => {
      const price = info.getValue();
      return <span className="text-sm">{price != null ? price : "—"}</span>;
    },
  }),

  col.display({
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <Link
        to="/dashboard/catalog/bundles/$bundleId"
        params={{ bundleId: info.row.original.id }}
        className="text-sm font-medium hover:underline"
      >
        Edit
      </Link>
    ),
  }),
];
