import {
	PromotionActivationType,
	PromotionApplicabilityTarget,
	PromotionConditionType,
	PromotionEffectType,
	PromotionStackingType,
} from "@repo/types";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCreatePromotion } from "../promotions.mutations";
import {
	defaultConditionFor,
	defaultEffectFor,
	promotionFormDefaults,
	promotionFormSchema,
	toCreatePromotionDto,
	type PromotionConditionFormValues,
} from "../schemas/promotion-form.schema";

const formId = "create-promotion";

const ACTIVATION_TYPE_LABELS: Record<PromotionActivationType, string> = {
	[PromotionActivationType.AUTOMATIC]: "Automatica",
	[PromotionActivationType.COUPON]: "Con cupon",
};

const STACKING_TYPE_LABELS: Record<PromotionStackingType, string> = {
	[PromotionStackingType.EXCLUSIVE]: "Exclusiva",
	[PromotionStackingType.COMBINABLE]: "Combinable",
};

const APPLICABILITY_LABELS: Record<PromotionApplicabilityTarget, string> = {
	[PromotionApplicabilityTarget.PRODUCT]: "Productos",
	[PromotionApplicabilityTarget.BUNDLE]: "Bundles",
};

const CONDITION_TYPE_LABELS: Record<PromotionConditionType, string> = {
	[PromotionConditionType.BOOKING_WINDOW]: "Ventana de reserva",
	[PromotionConditionType.RENTAL_WINDOW]: "Ventana de alquiler",
	[PromotionConditionType.CUSTOMER_ID_IN]: "Clientes especificos",
	[PromotionConditionType.MIN_SUBTOTAL]: "Subtotal minimo",
	[PromotionConditionType.RENTAL_DURATION_MIN]: "Duracion minima",
	[PromotionConditionType.CATEGORY_ITEM_QUANTITY]: "Cantidad por categoria",
	[PromotionConditionType.DISTINCT_CATEGORIES_WITH_MIN_QUANTITY]:
		"Categorias distintas",
};

const EFFECT_TYPE_LABELS: Record<PromotionEffectType, string> = {
	[PromotionEffectType.PERCENT_OFF]: "Porcentaje simple",
	[PromotionEffectType.LONG_RENTAL_TIERED_PERCENT_OFF]:
		"Tramos por alquiler largo",
};

type PromotionFormApi = any;

export function CreatePromotionDialogForm() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [nextConditionType, setNextConditionType] = useState(
		PromotionConditionType.BOOKING_WINDOW,
	);
	const { mutateAsync: createPromotion, isPending } = useCreatePromotion();

	const form = useForm({
		defaultValues: promotionFormDefaults,
		validators: {
			onSubmit: promotionFormSchema,
		},
		onSubmit: async ({ value }) => {
			await createPromotion(toCreatePromotionDto(value));
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
						Nueva promocion
					</Button>
				}
			/>

			<DialogContent className="max-h-svh overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Nueva promocion</DialogTitle>
					<DialogDescription>
						Configura activacion, condiciones, aplicabilidad y efecto de la
						promocion.
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
						<Section
							title="Configuracion basica"
							description="Define cuando se activa y como se combina la promocion."
						>
							<form.Field name="name">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
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

							<div className="grid gap-4 sm:grid-cols-2">
								<EnumSelectField
									form={form}
									name="activationType"
									label="Tipo de activacion"
									options={ACTIVATION_TYPE_LABELS}
								/>
								<EnumSelectField
									form={form}
									name="stackingType"
									label="Stacking"
									options={STACKING_TYPE_LABELS}
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-3">
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
													Menor numero = mayor prioridad.
												</FieldDescription>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
								<DateField form={form} name="validFrom" label="Valida desde" />
								<DateField form={form} name="validUntil" label="Valida hasta" />
							</div>
						</Section>

						<Section
							title="Aplicabilidad"
							description="Define si la promocion aplica a productos, bundles o ambos, y que items quedan excluidos."
						>
							<form.Field name="applicability.appliesTo">
								{(field) => (
									<Field>
										<FieldLabel>Aplica a</FieldLabel>
										<div className="grid gap-3 sm:grid-cols-2">
											{Object.values(PromotionApplicabilityTarget).map(
												(target) => {
													const checked = field.state.value.includes(target);

													return (
														<div
															key={target}
															className="flex items-start gap-3 rounded-lg border px-4 py-3"
														>
															<Checkbox
																id={`applies-to-${target}`}
																checked={checked}
																onCheckedChange={(nextChecked) => {
																	field.handleChange(
																		nextChecked === true
																			? field.state.value.includes(target)
																				? field.state.value
																				: [...field.state.value, target]
																			: field.state.value.filter(
																					(value) => value !== target,
																				),
																	);
																}}
															/>
															<div>
																<FieldLabel htmlFor={`applies-to-${target}`}>
																	{APPLICABILITY_LABELS[target]}
																</FieldLabel>
																<p className="text-muted-foreground text-xs">
																	{target ===
																	PromotionApplicabilityTarget.PRODUCT
																		? "Considera lineas de producto standalone."
																		: "Aplica sobre bundles completos."}
																</p>
															</div>
														</div>
													);
												},
											)}
										</div>
										{field.state.meta.isTouched &&
											!field.state.meta.isValid && (
												<FieldError errors={field.state.meta.errors} />
											)}
									</Field>
								)}
							</form.Field>

							<StringArrayField
								form={form}
								name="applicability.excludedProductTypeIds"
								label="Product type IDs excluidos"
								description="Usa UUIDs de product types que no deben recibir la promocion."
								placeholder="UUID del product type"
							/>
							<StringArrayField
								form={form}
								name="applicability.excludedBundleIds"
								label="Bundle IDs excluidos"
								description="Usa UUIDs de bundles que no deben recibir la promocion."
								placeholder="UUID del bundle"
							/>
						</Section>

						<Section
							title="Condiciones"
							description="Las condiciones califican la promocion usando el contexto completo de la orden."
						>
							<form.Field name="conditions" mode="array">
								{(field) => (
									<div className="space-y-4">
										{field.state.value.length === 0 && (
											<div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
												Sin condiciones. La promocion dependera solo de su
												activacion y aplicabilidad.
											</div>
										)}

										{field.state.value.map((condition, index) => (
											<div
												key={`${condition.type}-${index}`}
												className="space-y-4 rounded-xl border p-4"
											>
												<div className="flex items-center justify-between gap-3">
													<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
														<div>
															<p className="font-medium text-sm">
																Condicion {index + 1}
															</p>
														</div>
														<form.Field name={`conditions[${index}].type`}>
															{(typeField: any) => (
																<Field>
																	<FieldLabel>Tipo</FieldLabel>
																	<Select
																		value={typeField.state.value}
																		onValueChange={(value) => {
																			const nextType =
																				value as PromotionConditionType;
																			form.setFieldValue(
																				`conditions[${index}]` as never,
																				defaultConditionFor(nextType) as never,
																			);
																		}}
																	>
																		<SelectTrigger>
																			<SelectValue />
																		</SelectTrigger>
																		<SelectContent>
																			{Object.values(
																				PromotionConditionType,
																			).map((type) => (
																				<SelectItem key={type} value={type}>
																					{CONDITION_TYPE_LABELS[type]}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</Field>
															)}
														</form.Field>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => field.removeValue(index)}
													>
														<Minus className="h-4 w-4" />
														Quitar
													</Button>
												</div>

												<ConditionFields
													form={form}
													index={index}
													condition={condition}
												/>
											</div>
										))}

										<div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-end sm:justify-between">
											<div className="grid gap-2">
												<FieldLabel>Agregar condicion</FieldLabel>
												<Select
													value={nextConditionType}
													onValueChange={(value) =>
														setNextConditionType(
															value as PromotionConditionType,
														)
													}
												>
													<SelectTrigger className="sm:min-w-72">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{Object.values(PromotionConditionType).map(
															(type) => (
																<SelectItem key={type} value={type}>
																	{CONDITION_TYPE_LABELS[type]}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>

											<Button
												type="button"
												onClick={() =>
													field.pushValue(
														defaultConditionFor(nextConditionType),
													)
												}
												className="gap-2"
											>
												<Plus className="h-4 w-4" />
												Agregar condicion
											</Button>
										</div>
									</div>
								)}
							</form.Field>
						</Section>

						<Section
							title="Efecto"
							description="Define si el descuento es un porcentaje simple o por tramos de alquiler largo."
						>
							<form.Field name="effect.type">
								{(field) => (
									<Field>
										<FieldLabel>Tipo de efecto</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												form.setFieldValue(
													"effect",
													defaultEffectFor(value as PromotionEffectType),
												);
											}}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Object.values(PromotionEffectType).map((type) => (
													<SelectItem key={type} value={type}>
														{EFFECT_TYPE_LABELS[type]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
							</form.Field>

							<form.Subscribe selector={(state) => state.values.effect}>
								{(effect) =>
									effect.type === PromotionEffectType.PERCENT_OFF ? (
										<form.Field name="effect.percentage">
											{(field: any) => {
												const isInvalid =
													field.state.meta.isTouched &&
													!field.state.meta.isValid;

												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>
															Porcentaje
														</FieldLabel>
														<Input
															id={field.name}
															type="number"
															min={0}
															max={100}
															step={0.01}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(Number(e.target.value))
															}
															aria-invalid={isInvalid}
														/>
														{isInvalid && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</Field>
												);
											}}
										</form.Field>
									) : (
										<LongRentalTierEditor form={form} />
									)
								}
							</form.Subscribe>
						</Section>
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
							{isPending ? "Creando..." : "Crear promocion"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-4 rounded-xl border bg-muted/20 p-4">
			<div>
				<p className="font-medium text-sm">{title}</p>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>
			{children}
		</section>
	);
}

function EnumSelectField({
	form,
	name,
	label,
	options,
}: {
	form: PromotionFormApi;
	name: string;
	label: string;
	options: Record<string, string>;
}) {
	return (
		<form.Field name={name as never}>
			{(field: any) => {
				const isInvalid =
					field.state.meta.isTouched && !field.state.meta.isValid;

				return (
					<Field data-invalid={isInvalid}>
						<FieldLabel>{label}</FieldLabel>
						<Select
							value={field.state.value}
							onValueChange={field.handleChange}
						>
							<SelectTrigger aria-invalid={isInvalid}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(options).map(([value, text]) => (
									<SelectItem key={value} value={value}>
										{text}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{isInvalid && <FieldError errors={field.state.meta.errors} />}
					</Field>
				);
			}}
		</form.Field>
	);
}

function DateField({
	form,
	name,
	label,
}: {
	form: PromotionFormApi;
	name: string;
	label: string;
}) {
	return (
		<form.Field name={name as never}>
			{(field: any) => {
				const isInvalid =
					field.state.meta.isTouched && !field.state.meta.isValid;

				return (
					<Field data-invalid={isInvalid}>
						<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
						<Input
							id={field.name}
							type="date"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							aria-invalid={isInvalid}
						/>
						{isInvalid && <FieldError errors={field.state.meta.errors} />}
					</Field>
				);
			}}
		</form.Field>
	);
}

function StringArrayField({
	form,
	name,
	label,
	description,
	placeholder,
}: {
	form: PromotionFormApi;
	name: string;
	label: string;
	description?: string;
	placeholder: string;
}) {
	return (
		<form.Field name={name as never} mode="array">
			{(field: any) => (
				<div className="space-y-3">
					<div>
						<FieldLabel>{label}</FieldLabel>
						{description ? (
							<FieldDescription>{description}</FieldDescription>
						) : null}
					</div>

					{field.state.value.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Sin valores cargados.
						</p>
					) : (
						field.state.value.map((value: string, index: number) => (
							<form.Field
								key={`${name}-${value || "empty"}-${index}`}
								name={`${name}[${index}]` as never}
							>
								{(itemField: any) => {
									const isInvalid =
										itemField.state.meta.isTouched &&
										!itemField.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<div className="flex items-start gap-2">
												<Input
													value={itemField.state.value}
													onBlur={itemField.handleBlur}
													onChange={(e) =>
														itemField.handleChange(e.target.value)
													}
													placeholder={placeholder}
													aria-invalid={isInvalid}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => field.removeValue(index)}
												>
													<Minus className="h-4 w-4" />
												</Button>
											</div>
											{isInvalid && (
												<FieldError errors={itemField.state.meta.errors} />
											)}
										</Field>
									);
								}}
							</form.Field>
						))
					)}

					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => field.pushValue("")}
					>
						<Plus className="h-4 w-4" />
						Agregar UUID
					</Button>
				</div>
			)}
		</form.Field>
	);
}

function ConditionFields({
	form,
	index,
	condition,
}: {
	form: PromotionFormApi;
	index: number;
	condition: PromotionConditionFormValues;
}) {
	if (
		condition.type === PromotionConditionType.BOOKING_WINDOW ||
		condition.type === PromotionConditionType.RENTAL_WINDOW
	) {
		return (
			<div className="grid gap-4 sm:grid-cols-2">
				<DateField
					form={form}
					name={`conditions[${index}].from`}
					label="Desde"
				/>
				<DateField form={form} name={`conditions[${index}].to`} label="Hasta" />
			</div>
		);
	}

	if (condition.type === PromotionConditionType.CUSTOMER_ID_IN) {
		return (
			<StringArrayField
				form={form}
				name={`conditions[${index}].customerIds`}
				label="Customer IDs"
				placeholder="UUID del cliente"
			/>
		);
	}

	if (condition.type === PromotionConditionType.MIN_SUBTOTAL) {
		return (
			<div className="grid gap-4 sm:grid-cols-2">
				<NumberField
					form={form}
					name={`conditions[${index}].amount`}
					label="Monto minimo"
					step={0.01}
				/>
				<form.Field name={`conditions[${index}].currency` as never}>
					{(field: any) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Moneda</FieldLabel>
								<Input
									id={field.name}
									maxLength={3}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value.toUpperCase())
									}
									aria-invalid={isInvalid}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
			</div>
		);
	}

	if (condition.type === PromotionConditionType.RENTAL_DURATION_MIN) {
		return (
			<NumberField
				form={form}
				name={`conditions[${index}].minUnits`}
				label="Unidades minimas"
				min={1}
			/>
		);
	}

	if (condition.type === PromotionConditionType.CATEGORY_ITEM_QUANTITY) {
		return (
			<div className="grid gap-4 sm:grid-cols-2">
				<TextField
					form={form}
					name={`conditions[${index}].categoryId`}
					label="Category ID"
					placeholder="UUID de la categoria"
				/>
				<NumberField
					form={form}
					name={`conditions[${index}].minQuantity`}
					label="Cantidad minima"
					min={1}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<StringArrayField
				form={form}
				name={`conditions[${index}].categoryIds`}
				label="Category IDs"
				placeholder="UUID de la categoria"
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<NumberField
					form={form}
					name={`conditions[${index}].minCategoriesMatched`}
					label="Categorias que deben calificar"
					min={1}
				/>
				<NumberField
					form={form}
					name={`conditions[${index}].minQuantityPerCategory`}
					label="Cantidad minima por categoria"
					min={1}
				/>
			</div>
		</div>
	);
}

function LongRentalTierEditor({ form }: { form: PromotionFormApi }) {
	return (
		<form.Field name="effect.tiers" mode="array">
			{(field: any) => (
				<div className="space-y-4">
					{field.state.value.map((tier: any, index: number) => (
						<div
							key={`${tier.fromUnits}-${index}`}
							className="grid gap-4 rounded-xl border p-4 sm:grid-cols-4"
						>
							<NumberField
								form={form}
								name={`effect.tiers[${index}].fromUnits`}
								label="Desde"
								min={1}
							/>
							<form.Field name={`effect.tiers[${index}].toUnits` as never}>
								{(subField: any) => {
									const isInvalid =
										subField.state.meta.isTouched &&
										!subField.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={subField.name}>Hasta</FieldLabel>
											<Input
												id={subField.name}
												type="number"
												min={1}
												placeholder="Abierto"
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
												<FieldError errors={subField.state.meta.errors} />
											)}
										</Field>
									);
								}}
							</form.Field>
							<NumberField
								form={form}
								name={`effect.tiers[${index}].percentage`}
								label="Porcentaje"
								min={0}
								max={100}
								step={0.01}
							/>
							<div className="flex items-end">
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
						</div>
					))}

					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							const lastTier = field.state.value[field.state.value.length - 1];
							const nextFrom = lastTier?.toUnits
								? lastTier.toUnits + 1
								: lastTier.fromUnits + 1;
							field.pushValue({
								fromUnits: nextFrom,
								toUnits: null,
								percentage: lastTier?.percentage ?? 10,
							});
						}}
					>
						<Plus className="h-4 w-4" />
						Agregar tramo
					</Button>
				</div>
			)}
		</form.Field>
	);
}

function TextField({
	form,
	name,
	label,
	placeholder,
}: {
	form: PromotionFormApi;
	name: string;
	label: string;
	placeholder?: string;
}) {
	return (
		<form.Field name={name as never}>
			{(field: any) => {
				const isInvalid =
					field.state.meta.isTouched && !field.state.meta.isValid;

				return (
					<Field data-invalid={isInvalid}>
						<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
						<Input
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder={placeholder}
							aria-invalid={isInvalid}
						/>
						{isInvalid && <FieldError errors={field.state.meta.errors} />}
					</Field>
				);
			}}
		</form.Field>
	);
}

function NumberField({
	form,
	name,
	label,
	min,
	max,
	step,
}: {
	form: PromotionFormApi;
	name: string;
	label: string;
	min?: number;
	max?: number;
	step?: number;
}) {
	return (
		<form.Field name={name as never}>
			{(field: any) => {
				const isInvalid =
					field.state.meta.isTouched && !field.state.meta.isValid;

				return (
					<Field data-invalid={isInvalid}>
						<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
						<Input
							id={field.name}
							type="number"
							min={min}
							max={max}
							step={step}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(Number(e.target.value))}
							aria-invalid={isInvalid}
						/>
						{isInvalid && <FieldError errors={field.state.meta.errors} />}
					</Field>
				);
			}}
		</form.Field>
	);
}
