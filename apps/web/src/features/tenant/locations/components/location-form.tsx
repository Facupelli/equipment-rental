import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	type LocationFormValues,
	locationFormSchema,
} from "../schemas/location-form.schema";

interface LocationFormProps {
	defaultValues: LocationFormValues;
	onSubmit: (payload: {
		values: LocationFormValues;
		dirtyValues: Partial<LocationFormValues>;
	}) => Promise<void> | void;
	onCancel: () => void;
	isPending: boolean;
	submitLabel: string;
	pendingLabel: string;
	formId: string;
	showIsActiveField?: boolean;
}

function getDirtyValues(
	values: LocationFormValues,
	defaultValues: LocationFormValues,
): Partial<LocationFormValues> {
	const dirtyValues: Partial<LocationFormValues> = {};

	if (values.name !== defaultValues.name) {
		dirtyValues.name = values.name;
	}

	if (values.address !== defaultValues.address) {
		dirtyValues.address = values.address;
	}

	if (values.isActive !== defaultValues.isActive) {
		dirtyValues.isActive = values.isActive;
	}

	return dirtyValues;
}

export function LocationForm({
	defaultValues,
	onSubmit,
	onCancel,
	isPending,
	submitLabel,
	pendingLabel,
	formId,
	showIsActiveField = false,
}: LocationFormProps) {
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: locationFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onSubmit({
				values: value,
				dirtyValues: getDirtyValues(value, defaultValues),
			});
		},
	});

	const values = useStore(form.store, (state) => state.values);
	const hasChanges =
		values.name !== defaultValues.name ||
		values.address !== defaultValues.address ||
		(showIsActiveField && values.isActive !== defaultValues.isActive);

	return (
		<>
			<form
				id={formId}
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				<FieldGroup>
					<form.Field name="name">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										placeholder="Ej. Depósito central"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="address">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Dirección{" "}
										<span className="text-muted-foreground text-xs">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										placeholder="Ej. Av. Corrientes 1234"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					{showIsActiveField && (
						<form.Field name="isActive">
							{(field) => (
								<Field orientation="horizontal">
									<Checkbox
										id={field.name}
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked === true)
										}
									/>
									<FieldLabel htmlFor={field.name}>
										Crear como ubicación activa
									</FieldLabel>
								</Field>
							)}
						</form.Field>
					)}
				</FieldGroup>
			</form>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							form={formId}
							disabled={!canSubmit || !hasChanges || isPending}
						>
							{isSubmitting || isPending ? pendingLabel : submitLabel}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</>
	);
}
