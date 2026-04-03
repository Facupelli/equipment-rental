import type { LocationListItemResponse } from "@repo/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateLocationDialog } from "@/features/tenant/locations/components/create-location-dialog-form";
import { DeactivateLocationAlertDialog } from "@/features/tenant/locations/components/deactivate-location-alert-dialog";
import { EditLocationDialog } from "@/features/tenant/locations/components/edit-location-dialog";
import { getLocationColumns } from "@/features/tenant/locations/components/locations-column";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { OwnersDataTable } from "@/features/tenant/owners/components/owners-table";
import { AdminRouteError } from "@/shared/components/admin-route-error";

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
	const [editingLocation, setEditingLocation] =
		useState<LocationListItemResponse | null>(null);
	const [deactivatingLocation, setDeactivatingLocation] =
		useState<LocationListItemResponse | null>(null);

	return (
		<div className="space-y-6 p-8">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Ubicaciones</h1>
					<p className="text-sm text-muted-foreground">
						Gestiona los puntos operativos donde administras tu inventario.
					</p>
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Agregar ubicación
				</Button>
			</div>

			<LocationsTable
				onEdit={setEditingLocation}
				onDeactivate={setDeactivatingLocation}
			/>

			<CreateLocationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
			<EditLocationDialog
				open={editingLocation !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditingLocation(null);
					}
				}}
				location={editingLocation}
			/>
			<DeactivateLocationAlertDialog
				open={deactivatingLocation !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeactivatingLocation(null);
					}
				}}
				location={deactivatingLocation}
			/>
		</div>
	);
}

interface LocationsTableProps {
	onEdit: (location: LocationListItemResponse) => void;
	onDeactivate: (location: LocationListItemResponse) => void;
}

function LocationsTable({ onEdit, onDeactivate }: LocationsTableProps) {
	const navigate = useNavigate();
	const { data: locations = [], isPending, isError } = useLocations();
	const columns = getLocationColumns({ onEdit, onDeactivate });

	if (isError) {
		return (
			<p className="text-sm text-destructive">
				No pudimos cargar las ubicaciones. Inténtalo nuevamente.
			</p>
		);
	}

	if (isPending) {
		return <p className="text-sm text-muted-foreground">Cargando...</p>;
	}

	function handleRowClick(location: LocationListItemResponse) {
		navigate({
			to: "/dashboard/locations/$locationId",
			params: { locationId: location.id },
		});
	}

	return (
		<OwnersDataTable
			columns={columns}
			data={locations}
			searchColumn="name"
			searchPlaceholder="Buscar ubicaciones..."
			noDataMessage="No se encontraron ubicaciones."
			handleRowClick={handleRowClick}
		/>
	);
}
