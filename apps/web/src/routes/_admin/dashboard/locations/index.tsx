import { Button } from "@/components/ui/button";
import { CreateLocationDialog } from "@/features/tenant/locations/components/create-location-dialog-form";
import { locationColumns } from "@/features/tenant/locations/components/locations-column";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { OwnersDataTable } from "@/features/tenant/owners/components/owners-table";
import { AdminRouteError } from "@/shared/components/admin-route-error";
import type { LocationListItemResponse } from "@repo/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/dashboard/locations/")({
  errorComponent: ({ error }) => {
    return (
      <AdminRouteError
        error={error}
        genericMessage="No pudimos cargar el catalogo de ubicaciones."
        forbiddenMessage="No tienes permisos para ver las ubicaciones."
      />
    );
  },
  component: LocationsPage,
});

function LocationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Manage sites for storing and managing rental inventory.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <LocationsTable />

      <CreateLocationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function LocationsTable() {
  const navigate = useNavigate();
  const { data: locations = [], isPending, isError } = useLocations();

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load locations. Please try again.
      </p>
    );
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  function handleRowClick(location: LocationListItemResponse) {
    navigate({
      to: "/dashboard/locations/$locationId",
      params: { locationId: location.id },
    });
  }

  return (
    <OwnersDataTable
      columns={locationColumns}
      data={locations}
      searchColumn="name"
      searchPlaceholder="Search locations..."
      noDataMessage="No locations found."
      handleRowClick={handleRowClick}
    />
  );
}
