import {
	PromotionActivationType,
	PromotionApplicabilityTarget,
	PromotionConditionType,
	PromotionEffectType,
	PromotionStackingType,
} from "@repo/types";
import { useForm } from "@tanstack/react-form";
import { CircleHelp, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
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
	type PromotionConditionFormValues,
	type PromotionFormValues,
	promotionFormDefaults,
	promotionFormSchema,
	toCreatePromotionDto,
} from "../schemas/promotion-form.schema";

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

const CONDITION_TYPE_META: Record<
	PromotionConditionType,
	{ label: string; description: string }
> = {
	[PromotionConditionType.BOOKING_WINDOW]: {
		label: "Ventana de reserva",
		description:
			"La promocion aplica solo cuando la fecha de reserva cae dentro de un rango.",
	},
	[PromotionConditionType.RENTAL_WINDOW]: {
		label: "Ventana de alquiler",
		description:
			"La promocion aplica solo cuando el periodo alquilado ocurre dentro de un rango.",
	},
	[PromotionConditionType.CUSTOMER_ID_IN]: {
		label: "Clientes especificos",
		description:
			"Restringe la promocion a una lista concreta de clientes por UUID.",
	},
	[PromotionConditionType.MIN_SUBTOTAL]: {
		label: "Subtotal minimo",
		description: "Exige un monto minimo antes de aplicar el descuento.",
	},
	[PromotionConditionType.RENTAL_DURATION_MIN]: {
		label: "Duracion minima",
		description:
			"Requiere una cantidad minima de unidades de alquiler, como dias u horas.",
	},
	[PromotionConditionType.MIN_PRODUCT_QUANTITY]: {
		label: "Cantidad minima de productos",
		description:
			"Exige una cantidad minima total de productos standalone en la orden.",
	},
	[PromotionConditionType.MIN_PRODUCT_UNIT_PRICE]: {
		label: "Precio minimo por producto",
		description:
			"La promocion solo aplica a lineas de producto cuyo precio base por producto alcance ese monto.",
	},
};

const EFFECT_TYPE_LABELS: Record<PromotionEffectType, string> = {
	[PromotionEffectType.PERCENT_OFF]: "Porcentaje simple",
	[PromotionEffectType.LONG_RENTAL_TIERED_PERCENT_OFF]:
		"Tramos por alquiler largo",
};

type RootDateFieldName = "validFrom" | "validUntil";
type RootTextFieldName = "name";
type RootNumberFieldName = "priority";
type ConditionFieldName = `conditions[${number}]`;
type ConditionTypeFieldName = `conditions[${number}].type`;
type ConditionDateFieldName =
	| `conditions[${number}].from`
	| `conditions[${number}].to`;
type ConditionCurrencyFieldName = `conditions[${number}].currency`;
type ConditionNumberFieldName =
	| `conditions[${number}].amount`
	| `conditions[${number}].minUnits`
	| `conditions[${number}].minQuantity`;
type StringArrayFieldName =
	| "applicability.excludedProductTypeIds"
	| "applicability.excludedBundleIds"
	| `conditions[${number}].customerIds`;
type EffectPercentageFieldName = "effect.percentage";
type TierNumberFieldName =
	| `effect.tiers[${number}].fromUnits`
	| `effect.tiers[${number}].percentage`;
type TierNullableNumberFieldName = `effect.tiers[${number}].toUnits`;

type SelectItemOption<T extends string> = {
	label: string;
	value: T;
};

function usePromotionForm({
	defaultValues,
	onSubmit,
}: Pick<PromotionFormProps, "defaultValues" | "onSubmit">) {
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: promotionFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return { form };
}

type PromotionFormApi = ReturnType<typeof usePromotionForm>["form"];

interface PromotionFormProps {
	formId: string;
	defaultValues: PromotionFormValues;
	onCancel: () => void;
	onSubmit: (values: PromotionFormValues) => Promise<void>;
	isPending: boolean;
	submitLabel: string;
	pendingLabel: string;
}

const activationTypeItems = toSelectItems(ACTIVATION_TYPE_LABELS);
const stackingTypeItems = toSelectItems(STACKING_TYPE_LABELS);
const effectTypeItems = toSelectItems(EFFECT_TYPE_LABELS);
const conditionTypeItems = Object.entries(CONDITION_TYPE_META).map(
	([value, meta]) => ({
		value: value as PromotionConditionType,
		label: meta.label,
	}),
);

export function PromotionForm({
	formId,
	defaultValues,
	onCancel,
	onSubmit,
	isPending,
	submitLabel,
	pendingLabel,
}: PromotionFormProps) {
	const { form } = usePromotionForm({ defaultValues, onSubmit });
	const [firstConditionType] = conditionTypeItems;
	const [nextConditionType, setNextConditionType] = useState(
		firstConditionType?.value ?? PromotionConditionType.BOOKING_WINDOW,
	);

	return (
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
					<TextField form={form} name="name" label="Nombre" />

					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="activationType">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>Tipo de activacion</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												if (value !== null) {
													field.handleChange(value);
												}
											}}
											items={activationTypeItems}
										>
											<SelectTrigger aria-invalid={isInvalid}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{activationTypeItems.map((item) => (
													<SelectItem key={item.value} value={item.value}>
														{item.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="stackingType">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>Acumulacion</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												if (value !== null) {
													field.handleChange(value);
												}
											}}
											items={stackingTypeItems}
										>
											<SelectTrigger aria-invalid={isInvalid}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{stackingTypeItems.map((item) => (
													<SelectItem key={item.value} value={item.value}>
														{item.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>
					</div>

					<div className="grid gap-4 sm:grid-cols-3">
						<NumberField
							form={form}
							name="priority"
							label="Prioridad"
							description="Menor numero = mayor prioridad."
							min={0}
						/>
						<DateField form={form} name="validFrom" label="Valida desde" />
						<DateField form={form} name="validUntil" label="Valida hasta" />
					</div>
				</Section>

				<Section
					title="Aplicabilidad"
					description="Define si la promocion aplica a productos, bundles o ambos, y que elementos quedan excluidos."
				>
					<form.Field name="applicability.appliesTo">
						{(field) => (
							<Field>
								<FieldLabel>Aplica a</FieldLabel>
								<div className="grid gap-3 sm:grid-cols-2">
									{Object.values(PromotionApplicabilityTarget).map((target) => {
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
														{target === PromotionApplicabilityTarget.PRODUCT
															? "Considera lineas de producto individuales."
															: "Aplica sobre bundles completos."}
													</p>
												</div>
											</div>
										);
									})}
								</div>
								{field.state.meta.isTouched && !field.state.meta.isValid ? (
									<FieldError errors={field.state.meta.errors} />
								) : null}
							</Field>
						)}
					</form.Field>

					<StringArrayField
						form={form}
						name="applicability.excludedProductTypeIds"
						label="IDs de tipos de producto excluidos"
						description="Usa UUIDs de tipos de producto que no deben recibir la promocion."
						placeholder="UUID del tipo de producto"
					/>
					<StringArrayField
						form={form}
						name="applicability.excludedBundleIds"
						label="IDs de bundles excluidos"
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
								<div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-end sm:justify-between">
									<div className="grid gap-2">
										<FieldLabel className="flex items-center gap-2">
											<span>Agregar condicion</span>
											<ConditionTypeHelpPopover />
										</FieldLabel>
										<Select
											value={nextConditionType}
											onValueChange={(value) =>
												setNextConditionType(value as PromotionConditionType)
											}
											items={conditionTypeItems}
										>
											<SelectTrigger className="sm:min-w-72">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{conditionTypeItems.map((item) => (
													<SelectItem key={item.value} value={item.value}>
														{item.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<Button
										type="button"
										onClick={() =>
											field.pushValue(defaultConditionFor(nextConditionType))
										}
										className="gap-2"
									>
										<Plus className="h-4 w-4" />
										Agregar condicion
									</Button>
								</div>

								{field.state.value.length === 0 ? (
									<div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
										Sin condiciones. La promocion dependera solo de su
										activacion y aplicabilidad.
									</div>
								) : null}

								{field.state.value.map((condition, index) => {
									const conditionName =
										`conditions[${index}]` as ConditionFieldName;
									const conditionTypeName =
										`conditions[${index}].type` as ConditionTypeFieldName;

									return (
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
													<form.Field name={conditionTypeName}>
														{(typeField) => (
															<Field>
																<FieldLabel className="flex items-center gap-2">
																	<span>Tipo</span>
																	<ConditionTypeHelpPopover />
																</FieldLabel>
																<Select
																	value={typeField.state.value}
																	onValueChange={(value) => {
																		form.setFieldValue(
																			conditionName,
																			defaultConditionFor(
																				value as PromotionConditionType,
																			),
																		);
																	}}
																	items={conditionTypeItems}
																>
																	<SelectTrigger>
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		{conditionTypeItems.map((item) => (
																			<SelectItem
																				key={item.value}
																				value={item.value}
																			>
																				{item.label}
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
									);
								})}
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
									items={effectTypeItems}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{effectTypeItems.map((item) => (
											<SelectItem key={item.value} value={item.value}>
												{item.label}
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
								<NumberField
									form={form}
									name="effect.percentage"
									label="Porcentaje"
									min={0}
									max={100}
									step={0.01}
								/>
							) : (
								<LongRentalTierEditor form={form} />
							)
						}
					</form.Subscribe>
				</Section>
			</FieldGroup>

			<div className="flex justify-end gap-3 border-t pt-6">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isPending}
				>
					Cancelar
				</Button>
				<Button type="submit" form={formId} disabled={isPending}>
					{isPending ? pendingLabel : submitLabel}
				</Button>
			</div>
		</form>
	);
}

const createFormId = "create-promotion";

export function CreatePromotionForm({
	onCancel,
	onSuccess,
}: {
	onCancel: () => void;
	onSuccess: () => void | Promise<void>;
}) {
	const { mutateAsync: createPromotion, isPending } = useCreatePromotion();

	return (
		<PromotionForm
			formId={createFormId}
			defaultValues={promotionFormDefaults}
			onCancel={onCancel}
			onSubmit={async (values) => {
				await createPromotion(toCreatePromotionDto(values));
				await onSuccess();
			}}
			isPending={isPending}
			submitLabel="Crear promocion"
			pendingLabel="Creando..."
		/>
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

function ConditionTypeHelpPopover() {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className="text-muted-foreground"
						aria-label="Explicacion de tipos de condicion"
					>
						<CircleHelp className="h-4 w-4" />
					</Button>
				}
			/>
			<PopoverContent align="start" className="w-80">
				<PopoverHeader>
					<PopoverTitle>Tipos de condicion</PopoverTitle>
					<PopoverDescription>
						Cada condicion usa una regla distinta para decidir si la promocion
						califica.
					</PopoverDescription>
				</PopoverHeader>
				<div className="space-y-3">
					{Object.values(PromotionConditionType).map((type) => (
						<div key={type} className="space-y-1">
							<p className="font-medium text-sm">
								{CONDITION_TYPE_META[type].label}
							</p>
							<p className="text-muted-foreground text-xs">
								{CONDITION_TYPE_META[type].description}
							</p>
						</div>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}

function DateField({
	form,
	name,
	label,
}: {
	form: PromotionFormApi;
	name: RootDateFieldName | ConditionDateFieldName;
	label: string;
}) {
	return (
		<form.Field name={name}>
			{(field) => {
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
						{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
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
	name: StringArrayFieldName;
	label: string;
	description?: string;
	placeholder: string;
}) {
	return (
		<form.Field name={name} mode="array">
			{(field) => (
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
						field.state.value.map((value, index) => {
							const itemName = `${name}[${index}]` as const;

							return (
								<form.Field
									key={`${name}-${value || "empty"}-${index}`}
									name={itemName}
								>
									{(itemField) => {
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
												{isInvalid ? (
													<FieldError errors={itemField.state.meta.errors} />
												) : null}
											</Field>
										);
									}}
								</form.Field>
							);
						})
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
				label="IDs de clientes"
				placeholder="UUID del cliente"
			/>
		);
	}

	if (condition.type === PromotionConditionType.MIN_SUBTOTAL) {
		const currencyName =
			`conditions[${index}].currency` as ConditionCurrencyFieldName;

		return (
			<div className="grid gap-4 sm:grid-cols-2">
				<NumberField
					form={form}
					name={`conditions[${index}].amount`}
					label="Monto minimo"
					step={0.01}
				/>
				<form.Field name={currencyName}>
					{(field) => {
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
								{isInvalid ? (
									<FieldError errors={field.state.meta.errors} />
								) : null}
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

	if (condition.type === PromotionConditionType.MIN_PRODUCT_QUANTITY) {
		return (
			<NumberField
				form={form}
				name={`conditions[${index}].minQuantity`}
				label="Cantidad minima"
					description="Cuenta solo productos individuales, no componentes de bundles."
					min={1}
				/>
		);
	}

	if (condition.type === PromotionConditionType.MIN_PRODUCT_UNIT_PRICE) {
		return (
			<div className="grid gap-4 sm:grid-cols-2">
				<NumberField
					form={form}
					name={`conditions[${index}].amount`}
					label="Monto minimo por producto"
					description="La linea debe tener este precio base o mas para calificar."
					min={0}
					step={0.01}
				/>
				<form.Field name={`conditions[${index}].currency` as ConditionCurrencyFieldName}>
					{(field) => {
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
								{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
							</Field>
						);
					}}
				</form.Field>
			</div>
		);
	}

	return null;
}

function LongRentalTierEditor({ form }: { form: PromotionFormApi }) {
	return (
		<form.Field name="effect.tiers" mode="array">
			{(field) => (
				<div className="space-y-4">
					{field.state.value.map((tier, index) => {
						const toUnitsName =
							`effect.tiers[${index}].toUnits` as TierNullableNumberFieldName;

						return (
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
								<form.Field name={toUnitsName}>
									{(subField) => {
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
												{isInvalid ? (
													<FieldError errors={subField.state.meta.errors} />
												) : null}
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
						);
					})}

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
	name: RootTextFieldName;
	label: string;
	placeholder?: string;
}) {
	return (
		<form.Field name={name}>
			{(field) => {
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
						{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
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
	description,
	min,
	max,
	step,
}: {
	form: PromotionFormApi;
	name:
		| RootNumberFieldName
		| ConditionNumberFieldName
		| EffectPercentageFieldName
		| TierNumberFieldName;
	label: string;
	description?: string;
	min?: number;
	max?: number;
	step?: number;
}) {
	return (
		<form.Field name={name}>
			{(field) => {
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
						{description ? (
							<FieldDescription>{description}</FieldDescription>
						) : null}
						{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
					</Field>
				);
			}}
		</form.Field>
	);
}

function toSelectItems<T extends string>(
	options: Record<T, string>,
): SelectItemOption<T>[] {
	return Object.entries(options).map(([value, label]) => ({
		value: value as T,
		label: String(label),
	}));
}
