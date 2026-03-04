import type { LocationResponseDto } from "@repo/schemas";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";

export const locationColumns: ColumnDef<LocationResponseDto>[] = [
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
    id: "address",
    header: "Address",
    accessorFn: (row) =>
      `${row.address.street}, ${row.address.city}, ${row.address.state} ${row.address.zipCode}`,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>()}</span>
    ),
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
