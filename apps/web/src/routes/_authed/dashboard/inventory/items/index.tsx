import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { PaginationState } from "@tanstack/react-table";
import { useState } from "react";
import type { InventoryItemListItemDto } from "@repo/schemas";
import { useInventoryItems } from "@/features/inventory/inventory-items/inventory-items.queries";
import type { GetInventoryItemsParams } from "@/features/inventory/inventory-items/inventory-items.api";
import type { InventoryItemStatus } from "@repo/types";
import { getInventoryItemColumns } from "@/features/inventory/inventory-items/components/inventory-items-columns";
import { InventoryItemsTable } from "@/features/inventory/inventory-items/components/inventory-items-table";

export const Route = createFileRoute("/_authed/dashboard/inventory/items/")({
  component: InventoryItemsPage,
});

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 20 };

function InventoryItemsPage() {
  const navigate = useNavigate();

  const [pagination, setPagination] =
    useState<PaginationState>(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState<GetInventoryItemsParams>({});

  function handleFiltersChange(next: GetInventoryItemsParams) {
    setFilters(next);
    // Reset to page 1 on every filter change — the current page may not
    // exist in the new result set.
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  const { data, isFetching } = useInventoryItems({
    ...filters,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  // ---------------------------------------------------------------------------

  function handleEdit(item: InventoryItemListItemDto) {
    // navigate({
    //   to: '/dashboard/inventory/items/$itemId/edit',
    //   params: { itemId: item.id },
    // });
  }

  function handleChangeStatus(
    item: InventoryItemListItemDto,
    status: InventoryItemStatus,
  ) {
    // TODO: wire up mutation
    console.log("Change status", item.id, status);
  }

  // ---------------------------------------------------------------------------

  const columns = getInventoryItemColumns({
    onEdit: handleEdit,
    onChangeStatus: handleChangeStatus,
  });

  // ---------------------------------------------------------------------------

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

      <InventoryItemsTable
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
