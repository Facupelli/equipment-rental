import { Button } from "@/components/ui/button";
import { CreateOwnerDialog } from "@/features/tenant/owners/components/create-owner-dialog-form";
import { ownerColumns } from "@/features/tenant/owners/components/owners-columns";
import { OwnersDataTable } from "@/features/tenant/owners/components/owners-table";
import { useOwners } from "@/features/tenant/owners/owners.queries";
import { AdminRouteError } from "@/shared/components/admin-route-error";
import type { OwnerListItemResponse } from "@repo/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/dashboard/owners/")({
  errorComponent: ({ error }) => {
    return (
      <AdminRouteError
        error={error}
        genericMessage="No pudimos cargar los propietarios."
        forbiddenMessage="No tienes permisos para ver los propietarios."
      />
    );
  },
  component: OwnersPage,
});

function OwnersPage() {
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);

  function handleRowClick(owner: OwnerListItemResponse) {
    navigate({
      to: "/dashboard/owners/$ownerId",
      params: { ownerId: owner.id },
    });
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Asset Owners
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage external entities owning rental inventory.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Owner
        </Button>
      </div>

      <OwnersTable handleRowClick={handleRowClick} />

      <CreateOwnerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function OwnersTable({
  handleRowClick,
}: {
  handleRowClick: (owner: OwnerListItemResponse) => void;
}) {
  const { data: owners = [], isPending, isError } = useOwners();

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load owners. Please try again.
      </p>
    );
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <OwnersDataTable
      columns={ownerColumns}
      data={owners}
      searchColumn="name"
      searchPlaceholder="Search owners..."
      handleRowClick={handleRowClick}
    />
  );
}
