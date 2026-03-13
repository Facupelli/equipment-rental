import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import type { LocationListItemResponse } from "@repo/schemas";

export const locationColumns: ColumnDef<LocationListItemResponse>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Location Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.getValue("isActive") ? (
        <Badge
          variant="outline"
          className="border-emerald-500 text-emerald-500"
        >
          Active
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="border-muted-foreground text-muted-foreground"
        >
          Inactive
        </Badge>
      ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => null, // placeholder
  },
];
