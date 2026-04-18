import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProblemDetailsError } from "@/shared/errors";
import {
	useCreateBlackoutAssignments,
	useCreateMaintenanceAssignments,
} from "../assets.queries";
import {
	assetAssignmentFormSchema,
	getAssetAssignmentFormDefaults,
	toCreateBlackoutAssignmentsDto,
	toCreateMaintenanceAssignmentsDto,
} from "../schemas/asset-assignment-form.schema";

const formId = "bulk-asset-assignment";

type AssignmentMode = "blackout" | "maintenance";

interface BulkAssetAssignmentDialogProps {
	mode: AssignmentMode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedAssetIds: string[];
	onSelectionChange: (updater: (previous: string[]) => string[]) => void;
	onSuccess: () => void;
}

const COPY: Record<
	AssignmentMode,
	{
		title: string;
		description: string;
		submitLabel: string;
		pendingLabel: string;
		successLabel: (count: number) => string;
		conflictLabel: string;
		invalidLabel: string;
	}
> = {
	blackout: {
		title: "Crear blackout",
		description:
			"Bloquea temporalmente los assets seleccionados para que no puedan asignarse.",
		submitLabel: "Crear blackout",
		pendingLabel: "Creando blackout...",
		successLabel: (count) =>
			`${count} asset${count === 1 ? "" : "s"} marcados en blackout.`,
		conflictLabel:
			"Algunos assets ya tienen una asignacion superpuesta para ese periodo.",
		invalidLabel:
			"La seleccion contiene assets invalidos o desactualizados. Revisa la lista e intentalo nuevamente.",
	},
	maintenance: {
		title: "Crear mantenimiento",
		description:
			"Reserva temporalmente los assets seleccionados para mantenimiento.",
		submitLabel: "Crear mantenimiento",
		pendingLabel: "Creando mantenimiento...",
		successLabel: (count) =>
			`${count} asset${count === 1 ? "" : "s"} marcados en mantenimiento.`,
		conflictLabel:
			"Algunos assets ya tienen una asignacion superpuesta para ese periodo.",
		invalidLabel:
			"La seleccion contiene assets invalidos o desactualizados. Revisa la lista e intentalo nuevamente.",
	},
};

export function BulkAssetAssignmentDialog({
	mode,
	open,
	onOpenChange,
	selectedAssetIds,
	onSelectionChange,
	onSuccess,
}: BulkAssetAssignmentDialogProps) {
	const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
		null,
	);
	const [affectedAssetIds, setAffectedAssetIds] = useState<string[]>([]);

	const {
		mutateAsync: createBlackoutAssignments,
		isPending: isBlackoutPending,
	} = useCreateBlackoutAssignments();
	const {
		mutateAsync: createMaintenanceAssignments,
		isPending: isMaintenancePending,
	} = useCreateMaintenanceAssignments();

	const isPending =
		mode === "blackout" ? isBlackoutPending : isMaintenancePending;
	const copy = COPY[mode];

	const form = useForm({
		defaultValues: getAssetAssignmentFormDefaults(),
		validators: {
			onSubmit: assetAssignmentFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				setSubmitErrorMessage(null);
				setAffectedAssetIds([]);

				const result =
					mode === "blackout"
						? await createBlackoutAssignments(
								toCreateBlackoutAssignmentsDto(value, selectedAssetIds),
							)
						: await createMaintenanceAssignments(
								toCreateMaintenanceAssignmentsDto(value, selectedAssetIds),
							);

				toast.success(copy.successLabel(result.createdCount));
				handleOpenChange(false);
				onSuccess();
			} catch (error) {
				const submitError = getSubmitError(error, copy);

				if (!submitError) {
					throw error;
				}

				setSubmitErrorMessage(submitError.message);
				setAffectedAssetIds(submitError.assetIds);

				if (submitError.status === 422 && submitError.assetIds.length > 0) {
					onSelectionChange((previous) =>
						previous.filter(
							(assetId) => !submitError.assetIds.includes(assetId),
						),
					);
				}
			}
		},
	});

	function handleOpenChange(nextOpen: boolean) {
		onOpenChange(nextOpen);

		if (!nextOpen) {
			form.reset();
			setSubmitErrorMessage(null);
			setAffectedAssetIds([]);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{copy.title}</DialogTitle>
					<DialogDescription>
						{copy.description} {selectedAssetIds.length} asset
						{selectedAssetIds.length === 1 ? "" : "s"} seleccionados.
					</DialogDescription>
				</DialogHeader>

				{open ? (
					<>
						<form
							id={formId}
							onSubmit={(event) => {
								event.preventDefault();
								event.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-6"
						>
							<FieldGroup>
								{submitErrorMessage ? (
									<Field data-invalid={true}>
										<FieldError>{submitErrorMessage}</FieldError>
										{affectedAssetIds.length > 0 ? (
											<FieldDescription>
												Assets afectados: {affectedAssetIds.join(", ")}
											</FieldDescription>
										) : null}
									</Field>
								) : null}

								<div className="grid gap-4 sm:grid-cols-2">
									<form.Field name="startDate">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;

											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Inicio</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														type="datetime-local"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														aria-invalid={isInvalid}
													/>
													{isInvalid ? (
														<FieldError errors={field.state.meta.errors} />
													) : null}
												</Field>
											);
										}}
									</form.Field>

									<form.Field name="endDate">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;

											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Fin</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														type="datetime-local"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														aria-invalid={isInvalid}
													/>
													{isInvalid ? (
														<FieldError errors={field.state.meta.errors} />
													) : null}
												</Field>
											);
										}}
									</form.Field>
								</div>

								<form.Field name="reason">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;

										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Motivo
													<span className="text-muted-foreground text-xs">
														{" "}
														(opcional)
													</span>
												</FieldLabel>
												<Textarea
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													placeholder="Agrega una nota para el equipo operativo"
													className="min-h-24 resize-none"
													aria-invalid={isInvalid}
												/>
												{isInvalid ? (
													<FieldError errors={field.state.meta.errors} />
												) : null}
											</Field>
										);
									}}
								</form.Field>
							</FieldGroup>
						</form>

						<DialogFooter>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<>
										<Button
											type="button"
											variant="ghost"
											onClick={() => handleOpenChange(false)}
											disabled={isPending}
										>
											Cancelar
										</Button>
										<Button
											type="submit"
											form={formId}
											disabled={
												!canSubmit || isPending || selectedAssetIds.length === 0
											}
										>
											{isSubmitting || isPending
												? copy.pendingLabel
												: copy.submitLabel}
										</Button>
									</>
								)}
							</form.Subscribe>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function getSubmitError(
	error: unknown,
	copy: (typeof COPY)[AssignmentMode],
): { message: string; assetIds: string[]; status: number } | null {
	if (!(error instanceof ProblemDetailsError)) {
		return null;
	}

	const { problemDetails } = error;
	const assetIds = getProblemAssetIds(problemDetails.assetIds);

	if (problemDetails.status === 409) {
		return {
			message: problemDetails.detail ?? copy.conflictLabel,
			assetIds,
			status: 409,
		};
	}

	if (problemDetails.status === 422) {
		return {
			message: problemDetails.detail ?? copy.invalidLabel,
			assetIds,
			status: 422,
		};
	}

	return {
		message:
			problemDetails.detail ??
			problemDetails.title ??
			"No se pudo completar la accion sobre los assets seleccionados.",
		assetIds,
		status: problemDetails.status,
	};
}

function getProblemAssetIds(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item): item is string => typeof item === "string");
}
