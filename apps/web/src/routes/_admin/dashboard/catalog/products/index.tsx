import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductsTable } from "@/features/catalog/product-types/components/products-table";
import { useProducts } from "@/features/catalog/product-types/products.queries";
import { rentalQueries } from "@/features/rental/rental.queries";

import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import type { PaginationState } from "@tanstack/react-table";
import { useState } from "react";

export const Route = createFileRoute("/_admin/dashboard/catalog/products/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(rentalQueries.products()),
  component: ProductsPage,
});

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 20,
};

function ProductsPage() {
  const [pagination, setPagination] =
    useState<PaginationState>(DEFAULT_PAGINATION);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const { data: products, isFetching } = useProducts({
    page: pagination.pageIndex + 1, // TanStack Table is 0-indexed; API is 1-indexed
    limit: pagination.pageSize,
    categoryId,
  });

  // When a filter changes, reset to first page to avoid landing on a
  // non-existent page (e.g. was on page 5, filter now yields only 2 pages)
  function handleCategoryChange(nextCategoryId: string | undefined) {
    setCategoryId(nextCategoryId);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  return (
    <>
      <header className="flex items-center justify-between border-b gap-10 border-gray-200 bg-white p-6">
        <Input type="search" placeholder="Search" />

        <Button
          render={
            <Link to="/dashboard/catalog/products/new">CREATE PRODUCT</Link>
          }
        />
      </header>

      <div className="p-6 space-y-2">
        <h1 className="text-lg font-semibold">Product Catalog</h1>

        <ProductsTable
          products={products?.data ?? []}
          meta={
            products?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }
          }
          pagination={pagination}
          categoryId={categoryId}
          onPaginationChange={setPagination}
          onCategoryChange={handleCategoryChange}
          isLoading={isFetching}
        />
      </div>
    </>
  );
}
