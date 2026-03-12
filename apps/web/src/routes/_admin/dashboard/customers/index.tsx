import { createFileRoute } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCustomersFilters } from "@/features/customer/components/customers-table/use-customers-filters";
import { useCustomers } from "@/features/customer/customer.queries";
import { customersColumns } from "@/features/customer/components/customers-table/customers-columns";
import { CustomersToolbar } from "@/features/customer/components/customers-table/customers-toolbar";

export const Route = createFileRoute("/_admin/dashboard/customers/")({
  component: CustomersPage,
});

function CustomersPage() {
  const {
    filters,
    queryParams,
    hasActiveFilters,
    setSearch,
    setOnboardingStatus,
    setIsActive,
    setIsCompany,
    setPage,
    resetFilters,
  } = useCustomersFilters();

  const { data, isLoading, isError } = useCustomers(queryParams);

  const customers = data?.data ?? [];
  const meta = data?.meta;

  const table = useReactTable({
    data: customers,
    columns: customersColumns,
    getCoreRowModel: getCoreRowModel(),

    // Server-side pagination
    manualPagination: true,
    pageCount: meta?.totalPages ?? -1, // -1 signals "unknown" to TanStack
    state: {
      pagination: {
        pageIndex: filters.page - 1, // TanStack is 0-indexed; our API is 1-indexed
        pageSize: filters.limit,
      },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: filters.page - 1, pageSize: filters.limit })
          : updater;
      setPage(next.pageIndex + 1);
    },

    manualFiltering: true,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your customers — track, manage, and invite new ones.
        </p>
      </div>
      <div className="space-y-2">
        <CustomersToolbar
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          setSearch={setSearch}
          setOnboardingStatus={setOnboardingStatus}
          setIsActive={setIsActive}
          setIsCompany={setIsCompany}
          resetFilters={resetFilters}
        />

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
                <SkeletonRows
                  columns={customersColumns.length}
                  rows={filters.limit}
                />
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={customersColumns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Something went wrong loading customers.
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={customersColumns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationFooter
          page={filters.page}
          totalPages={meta?.totalPages ?? 1}
          total={meta?.total ?? 0}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onPrevious={() => table.previousPage()}
          onNext={() => table.nextPage()}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  // Cap the skeleton at a sensible visual amount regardless of page limit
  const skeletonCount = Math.min(rows, 10);
  return (
    <>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function PaginationFooter({
  page,
  totalPages,
  total,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-sm text-muted-foreground">
        {total} customer{total !== 1 ? "s" : ""} total
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onPrevious}
          disabled={!canPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNext}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
