import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateLongRentalDiscount } from "../long-rental-discounts.mutations";
import {
	createEmptyLongRentalDiscountTier,
	longRentalDiscountFormDefaults,
	longRentalDiscountFormSchema,
	toCreateLongRentalDiscountDto,
} from "../schemas/long-rental-discount-form.schema";

const formId = "create-long-rental-discount";

export function CreateLongRentalDiscountDialogForm() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { mutateAsync: createLongRentalDiscount, isPending } =
		useCreateLongRentalDiscount();

	const form = useForm({
		defaultValues: longRentalDiscountFormDefaults,
		validators: {
			onSubmit: longRentalDiscountFormSchema,
		},
		onSubmit: async ({ value }) => {
			await createLongRentalDiscount(toCreateLongRentalDiscountDto(value));
			form.reset();
			setIsDialogOpen(false);
		},
	});

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			form.reset();
		}

		setIsDialogOpen(nextOpen);
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger
				render={
					<Button className="shrink-0 gap-2" type="button">
						<Plus className="h-4 w-4" />
						Nuevo descuento por alquiler largo
					</Button>
				}
			/>

			<DialogContent className="max-h-svh overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Nuevo descuento por alquiler largo</DialogTitle>
					<DialogDescription>
						Crea un descuento automático según la duración del alquiler.
					</DialogDescription>
				</DialogHeader>

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
										<FieldLabel htmlFor={field.name}>
											Nombre del descuento
										</FieldLabel>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="priority">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Prioridad</FieldLabel>
										<Input
											id={field.name}
											type="number"
											min={0}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(Number(e.target.value))
											}
											aria-invalid={isInvalid}
										/>
										<FieldDescription>
											Menor número = mayor prioridad.
										</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<div className="rounded-xl border bg-card px-5 py-4">
							<div className="space-y-1">
								<FieldLabel>Tramos de duración del alquiler</FieldLabel>
								<FieldDescription>
									Se aplica automáticamente salvo exclusión. El último tramo
									debe quedar abierto.
								</FieldDescription>
							</div>

							<form.Field name="tiers" mode="array">
								{(field) => (
									<div className="mt-4 space-y-4">
										{field.state.value.map((tier, index) => (
											<div
												key={`${tier.fromUnits}-${tier.toUnits}-${index}`}
												className="rounded-lg border p-4"
											>
												<div className="mb-3 flex items-center justify-between gap-3">
													<p className="text-sm font-medium">
														Tramo {index + 1}
													</p>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => field.removeValue(index)}
														disabled={field.state.value.length <= 1}
													>
														<Minus className="h-4 w-4" />
														Quitar
													</Button>
												</div>

												<div className="grid gap-4 sm:grid-cols-3">
													<form.Field name={`tiers[${index}].fromUnits`}>
														{(subField) => {
															const isInvalid =
																subField.state.meta.isTouched &&
																!subField.state.meta.isValid;

															return (
																<Field data-invalid={isInvalid}>
																	<FieldLabel htmlFor={subField.name}>
																		Desde unidades
																	</FieldLabel>
																	<Input
																		id={subField.name}
																		type="number"
																		min={1}
																		value={subField.state.value}
																		onBlur={subField.handleBlur}
																		onChange={(e) =>
																			subField.handleChange(
																				Number(e.target.value),
																			)
																		}
																		aria-invalid={isInvalid}
																	/>
																	{isInvalid && (
																		<FieldError
																			errors={subField.state.meta.errors}
																		/>
																	)}
																</Field>
															);
														}}
													</form.Field>

													<form.Field name={`tiers[${index}].toUnits`}>
														{(subField) => {
															const isInvalid =
																subField.state.meta.isTouched &&
																!subField.state.meta.isValid;

															return (
																<Field data-invalid={isInvalid}>
																	<FieldLabel htmlFor={subField.name}>
																		Hasta unidades
																	</FieldLabel>
																	<Input
																		id={subField.name}
																		type="number"
																		min={1}
																		placeholder="Deja vacío para tramo abierto"
																		value={subField.state.value ?? ""}
																		onBlur={subField.handleBlur}
																		onChange={(e) =>
																			subField.handleChange(
																				e.target.value === ""
																					? null
																					: Number(e.target.value),
																			)
																		}
																		aria-invalid={isInvalid}
																	/>
																	{isInvalid && (
																		<FieldError
																			errors={subField.state.meta.errors}
																		/>
																	)}
																</Field>
															);
														}}
													</form.Field>

													<form.Field name={`tiers[${index}].discountPct`}>
														{(subField) => {
															const isInvalid =
																subField.state.meta.isTouched &&
																!subField.state.meta.isValid;

															return (
																<Field data-invalid={isInvalid}>
																	<FieldLabel htmlFor={subField.name}>
																		Descuento %
																	</FieldLabel>
																	<Input
																		id={subField.name}
																		type="number"
																		min={0}
																		max={100}
																		step={0.01}
																		value={subField.state.value}
																		onBlur={subField.handleBlur}
																		onChange={(e) =>
																			subField.handleChange(
																				Number(e.target.value),
																			)
																		}
																		aria-invalid={isInvalid}
																	/>
																	{isInvalid && (
																		<FieldError
																			errors={subField.state.meta.errors}
																		/>
																	)}
																</Field>
															);
														}}
													</form.Field>
												</div>
											</div>
										))}

										{field.state.meta.isTouched &&
											!field.state.meta.isValid && (
												<FieldError errors={field.state.meta.errors} />
											)}

										<Button
											type="button"
											variant="outline"
											onClick={() =>
												field.pushValue(
													createEmptyLongRentalDiscountTier(
														field.state.value.at(-1),
													),
												)
											}
										>
											<Plus className="h-4 w-4" />
											Agregar tramo
										</Button>
									</div>
								)}
							</form.Field>
						</div>
					</FieldGroup>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" form={formId} disabled={isPending}>
							{isPending ? "Creando..." : "Crear descuento por alquiler largo"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
