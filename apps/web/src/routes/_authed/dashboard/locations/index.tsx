import { Button } from "@/components/ui/button";
import { CreateLocationDialog } from "@/features/tenant/locations/components/create-location-dialog";
import { locationColumns } from "@/features/tenant/locations/components/locations-column";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { OwnersDataTable } from "@/features/tenant/owners/components/owners-table";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authed/dashboard/locations/")({
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

  return (
    <OwnersDataTable
      columns={locationColumns}
      data={locations}
      searchColumn="name"
      searchPlaceholder="Search locations..."
      noDataMessage="No locations found."
    />
  );
}
