import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories } from "@/features/inventory/categories/categories.queries";
import { useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { productColumns } from "./products-columns";
import type { PaginationMeta, ProductListItemResponseDto } from "@repo/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductsTableProps {
  products: ProductListItemResponseDto[];
  meta: PaginationMeta;
  pagination: PaginationState;
  categoryId: string | undefined;
  onPaginationChange: (updater: PaginationState) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_CATEGORIES_VALUE = "__all__";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductsTable({
  products,
  meta,
  pagination,
  categoryId,
  onPaginationChange,
  onCategoryChange,
  isLoading,
}: ProductsTableProps) {
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  const table = useReactTable({
    data: products,
    columns: productColumns,
    // Delegation: tell TanStack Table the server owns pagination and filtering
    manualPagination: true,
    manualFiltering: true,
    pageCount: meta.totalPages,
    state: { pagination },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleCategoryChange(value: string | null) {
    onCategoryChange(value === ALL_CATEGORIES_VALUE ? undefined : value);
  }

  function handleRowClick(product: ProductListItemResponseDto) {
    // navigate({
    //   to: "/dashboard/inventory/products/$productId",
    //   params: { productId: product.id },
    // });
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const categoryList = categories ?? [];
  const { pageIndex, pageSize } = pagination;
  const firstItem = meta.total === 0 ? 0 : pageIndex * pageSize + 1;
  const lastItem = Math.min((pageIndex + 1) * pageSize, meta.total);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Select
          value={categoryId ?? ALL_CATEGORIES_VALUE}
          onValueChange={handleCategoryChange}
          items={categories?.map((category) => ({
            label: category.name,
            value: category.id,
          }))}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
            {categoryList.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Skeleton rows — preserve table height during fetch to avoid layout shift
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {productColumns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={productColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {meta.total > 0
            ? `Showing ${firstItem}–${lastItem} of ${meta.total} products`
            : "No products"}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="min-w-[5rem] text-center">
            Page {meta.page} of {meta.totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
