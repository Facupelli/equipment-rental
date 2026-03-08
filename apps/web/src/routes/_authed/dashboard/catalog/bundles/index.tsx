import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBundles } from "@/features/catalog/bundles/bundles.queries";
import { bundleColumns } from "@/features/catalog/bundles/components/bundle-columns";
import useDebounce from "@/shared/hooks/use-debounce";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useState } from "react";
import z from "zod";

const bundlesSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  name: z.string().optional(),
});

export const Route = createFileRoute("/_authed/dashboard/catalog/bundles/")({
  validateSearch: bundlesSearchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    name: search.name,
  }),
  component: BundlesPage,
});

const PAGE_SIZE = 20;

function BundlesPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page, name: nameParam } = Route.useSearch();

  // Local state drives the input; debounced value hits the API + URL.
  const [searchInput, setSearchInput] = useState(nameParam ?? "");
  const debouncedName = useDebounce(searchInput, 300);

  // Sync debounced name into URL — reset to page 1 on new search.
  // We derive URL sync as an effect of rendering so the URL always reflects
  // the current debounced value without an extra useEffect.
  const effectiveName = debouncedName.trim() || undefined;

  const { data, isPending } = useBundles({
    page,
    limit: PAGE_SIZE,
    name: effectiveName,
  });

  const bundles = data?.data ?? [];
  const meta = data?.meta;

  const table = useReactTable({
    data: bundles,
    columns: bundleColumns,
    getCoreRowModel: getCoreRowModel(),
    // Pagination is server-side — we pass manual counts.
    manualPagination: true,
    pageCount: meta?.totalPages ?? -1,
  });

  function handleSearchChange(value: string) {
    setSearchInput(value);
    // Navigate immediately on each debounce tick — the debounced value
    // is what triggers the URL update.
    navigate({
      search: (prev) => ({
        ...prev,
        name: value.trim() || undefined,
        page: 1, // reset pagination on new search
      }),
      replace: true,
    });
  }

  function goToPage(newPage: number) {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
      replace: true,
    });
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage categories for organizing your products.
          </p>
        </div>

        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link to="/dashboard/catalog/bundles/new">Create Bundle</Link>
          }
        />
      </div>

      {/* Table card */}
      <div className="rounded-xl border">
        {/* Search */}
        <div className="p-4">
          <div className="relative max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search bundles by name…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isPending ? (
              // Skeleton rows — same count as page size to avoid layout shift
              Array.from({ length: Math.min(PAGE_SIZE, 5) }).map((_, i) => (
                <TableRow key={i}>
                  {bundleColumns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : bundles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={bundleColumns.length}
                  className="text-muted-foreground py-12 text-center text-sm"
                >
                  {nameParam
                    ? `No bundles found for "${nameParam}"`
                    : "No bundles yet. Create your first one."}
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

        {/* Footer — pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-sm">
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, meta.total)} of {meta.total} results
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                ‹
              </Button>

              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className="size-8"
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </Button>
                ),
              )}

              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => goToPage(page + 1)}
                disabled={page >= meta.totalPages}
                aria-label="Next page"
              >
                ›
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
