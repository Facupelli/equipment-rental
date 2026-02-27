import type { ColumnDef } from "@tanstack/react-table";
import type { InventoryItemListItemDto } from "@repo/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, RefreshCw } from "lucide-react";
import type { InventoryItemStatus } from "@repo/types";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  InventoryItemStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    className: string;
  }
> = {
  OPERATIONAL: {
    label: "Operational",
    variant: "default",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  MAINTENANCE: {
    label: "Maintenance",
    variant: "outline",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  RETIRED: {
    label: "Retired",
    variant: "secondary",
    className: "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-100",
  },
};

export function StatusBadge({ status }: { status: InventoryItemStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Actions cell
// ---------------------------------------------------------------------------

interface ActionsProps {
  item: InventoryItemListItemDto;
  onEdit: (item: InventoryItemListItemDto) => void;
  onChangeStatus: (
    item: InventoryItemListItemDto,
    status: InventoryItemStatus,
  ) => void;
}

function ActionsCell({ item, onEdit, onChangeStatus }: ActionsProps) {
  const nextStatuses = (
    Object.keys(STATUS_CONFIG) as InventoryItemStatus[]
  ).filter((s) => s !== item.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(item)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Change status
        </DropdownMenuLabel>
        {nextStatuses.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => onChangeStatus(item, status)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Mark as {STATUS_CONFIG[status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnOptions {
  onEdit: (item: InventoryItemListItemDto) => void;
  onChangeStatus: (
    item: InventoryItemListItemDto,
    status: InventoryItemStatus,
  ) => void;
}

export function getInventoryItemColumns({
  onEdit,
  onChangeStatus,
}: ColumnOptions): ColumnDef<InventoryItemListItemDto>[] {
  return [
    {
      id: "serial",
      header: "Serial / ID",
      cell: ({ row }) => {
        const { serialNumber, product } = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium font-mono text-sm">
              {serialNumber ?? "—"}
            </span>
            {product.trackingType === "BULK" && (
              <span className="text-xs text-muted-foreground">
                Qty: {row.original.totalQuantity}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.product.name}</span>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.category?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => row.original.location.name,
    },
    {
      id: "owner",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.owner.name}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionsCell
          item={row.original}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
        />
      ),
    },
  ];
}
