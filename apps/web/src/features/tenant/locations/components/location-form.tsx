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
}

function getDirtyValues(
	values: LocationFormValues,
	defaultValues: LocationFormValues,
): Partial<LocationFormValues> {
	const dirtyValues: Partial<LocationFormValues> = {};
	const deliveryDefaultsChanged =
		values.deliveryDefaults.country !==
			defaultValues.deliveryDefaults.country ||
		values.deliveryDefaults.stateRegion !==
			defaultValues.deliveryDefaults.stateRegion ||
		values.deliveryDefaults.city !== defaultValues.deliveryDefaults.city ||
		values.deliveryDefaults.postalCode !==
			defaultValues.deliveryDefaults.postalCode;

	if (values.name !== defaultValues.name) {
		dirtyValues.name = values.name;
	}

	if (values.address !== defaultValues.address) {
		dirtyValues.address = values.address;
	}

	if (values.timezone !== defaultValues.timezone) {
		dirtyValues.timezone = values.timezone;
	}

	if (values.isActive !== defaultValues.isActive) {
		dirtyValues.isActive = values.isActive;
	}

	if (values.supportsDelivery !== defaultValues.supportsDelivery) {
		dirtyValues.supportsDelivery = values.supportsDelivery;
	}

	if (deliveryDefaultsChanged) {
		dirtyValues.deliveryDefaults = values.deliveryDefaults;
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
		values.timezone !== defaultValues.timezone ||
		values.supportsDelivery !== defaultValues.supportsDelivery ||
		values.deliveryDefaults.country !==
			defaultValues.deliveryDefaults.country ||
		values.deliveryDefaults.stateRegion !==
			defaultValues.deliveryDefaults.stateRegion ||
		values.deliveryDefaults.city !== defaultValues.deliveryDefaults.city ||
		values.deliveryDefaults.postalCode !==
			defaultValues.deliveryDefaults.postalCode ||
		values.isActive !== defaultValues.isActive;

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

					<form.Field name="timezone">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Zona horaria{" "}
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
										placeholder="Ej. America/Argentina/Buenos_Aires"
									/>
									<p className="text-muted-foreground text-sm">
										Si se define, sobrescribe la zona horaria global del tenant.
									</p>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="supportsDelivery">
						{(field) => (
							<Field orientation="horizontal">
								<Checkbox
									id={field.name}
									checked={field.state.value}
									onCheckedChange={(checked) =>
										field.handleChange(checked === true)
									}
								/>
								<div>
									<FieldLabel htmlFor={field.name}>Habilitar envios</FieldLabel>
									<p className="text-muted-foreground text-sm">
										Permite que esta ubicacion ofrezca entrega a domicilio.
									</p>
								</div>
							</Field>
						)}
					</form.Field>

					{values.supportsDelivery && (
						<div className="space-y-4 rounded-md border p-4">
							<div>
								<p className="text-sm font-medium">
									Valores por defecto de entrega
								</p>
								<p className="text-muted-foreground text-sm">
									Se usan para precargar el formulario de envio en checkout.
								</p>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<form.Field name="deliveryDefaults.country">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;

										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Pais{" "}
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
													placeholder="Ej. Argentina"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="deliveryDefaults.stateRegion">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;

										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Provincia / region{" "}
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
													placeholder="Ej. Buenos Aires"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="deliveryDefaults.city">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;

										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Ciudad{" "}
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
													placeholder="Ej. CABA"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>

								<form.Field name="deliveryDefaults.postalCode">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;

										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Codigo postal{" "}
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
													placeholder="Ej. 1425"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
							</div>
						</div>
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
