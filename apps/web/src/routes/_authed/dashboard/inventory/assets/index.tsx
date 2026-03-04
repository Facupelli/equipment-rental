import { useAssets } from "@/features/inventory/assets/assets.queries";
import { AssetsTable } from "@/features/inventory/assets/components/assets-table";
import type { AssetResponse, GetAssetsQuery } from "@repo/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { PaginationState } from "@tanstack/react-table";
import { useState } from "react";
import { getAssetColumns } from "@/features/inventory/assets/components/aseets-columns";

export const Route = createFileRoute("/_authed/dashboard/inventory/assets/")({
  component: AssetsPage,
});

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 20 };

function AssetsPage() {
  const navigate = useNavigate();

  const [pagination, setPagination] =
    useState<PaginationState>(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState<GetAssetsQuery>({});

  function handleFiltersChange(next: GetAssetsQuery) {
    setFilters(next);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  const { data, isFetching } = useAssets({
    ...filters,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  function handleEdit(item: AssetResponse) {
    // navigate({
    //   to: '/dashboard/inventory/items/$itemId/edit',
    //   params: { itemId: item.id },
    // });
  }

  const columns = getAssetColumns({
    onEdit: handleEdit,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Inventory Items
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your fleet — serialized assets and bulk stock.
        </p>
      </div>

      <AssetsTable
        data={data?.data ?? []}
        meta={data?.meta}
        columns={columns}
        pagination={pagination}
        onPaginationChange={setPagination}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isFetching={isFetching}
      />
    </div>
  );
}
