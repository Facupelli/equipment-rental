import type { ProductTypeResponse } from "@repo/schemas";
import { useForm, useStore } from "@tanstack/react-form";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CatalogImageUploader } from "@/features/catalog/components/catalog-image-uploader";
import {
	type BundleComponentFormValues,
	type BundleFormValues,
	bundleFormSchema,
} from "../schemas/bundle-form.schema";
import { BundleProductSearch } from "./bundle-product-search";

interface BillingUnitOption {
	id: string;
	label: string;
}

interface BundleFormProps {
	defaultValues: BundleFormValues;
	billingUnits: BillingUnitOption[];
	onSubmit: (payload: {
		values: BundleFormValues;
		dirtyValues: Partial<BundleFormValues>;
	}) => Promise<void> | void;
	onCancel: () => void;
	isPending: boolean;
	submitLabel: string;
	pendingLabel: string;
	cancelLabel: string;
	formId: string;
	heading: string;
	description: string;
}

export function BundleForm({
	defaultValues,
	billingUnits,
	onSubmit,
	onCancel,
	isPending,
	submitLabel,
	pendingLabel,
	cancelLabel,
	formId,
	heading,
	description,
}: BundleFormProps) {
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: bundleFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onSubmit({
				values: value,
				dirtyValues: getDirtyValues(value, defaultValues),
			});
		},
	});

	const values = useStore(form.store, (state) => state.values);
	const addedIds = new Set(
		values.components.map((component) => component.productTypeId),
	);
	const hasChanges =
		Object.keys(getDirtyValues(values, defaultValues)).length > 0;
	const isSaveDisabled =
		!values.name.trim() ||
		!values.billingUnitId ||
		values.components.length === 0;

	function handleAddProduct(product: ProductTypeResponse) {
		const price = product.pricingTiers[0]?.pricePerUnit;
		const subtitle = [product.category?.name, price != null ? price : null]
			.filter(Boolean)
			.join(" · ");

		form.setFieldValue("components", (prev) => [
			...prev,
			{
				productTypeId: product.id,
				quantity: 1,
				name: product.name,
				subtitle,
				assetCount: product.assetCount,
			},
		]);
	}

	return (
		<div className="w-3xl mx-auto">
			<form
				id={formId}
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="flex min-h-screen flex-col"
			>
				<div className="border-border border-b px-6 py-5">
					<h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
					<p className="text-muted-foreground mt-1 text-sm">{description}</p>
				</div>

				<div className="flex-1 space-y-6 px-6 py-6">
					<div className="grid grid-cols-2 gap-4">
						<form.Field name="name">
							{(field) => (
								<div className="space-y-1.5">
									<Label
										htmlFor={field.name}
										className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
									>
										Nombre del combo
									</Label>
									<Input
										id={field.name}
										placeholder="Ej. Combo premium de algodon"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									{field.state.meta.errors[0] && (
										<p className="text-destructive text-xs">
											{field.state.meta.errors[0].message}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="billingUnitId">
							{(field) => (
								<div className="space-y-1.5">
									<Label
										htmlFor={field.name}
										className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
									>
										Unidad de cobro
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(value) => {
											if (value !== null) {
												field.handleChange(value);
											}
										}}
										items={billingUnits.map((unit) => ({
											value: unit.id,
											label: unit.label,
										}))}
									>
										<SelectTrigger
											id={field.name}
											aria-invalid={field.state.meta.errors.length > 0}
										>
											<SelectValue placeholder="Selecciona una unidad de cobro" />
										</SelectTrigger>
										<SelectContent>
											{billingUnits.map((unit) => (
												<SelectItem key={unit.id} value={unit.id}>
													{unit.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{field.state.meta.errors[0] && (
										<p className="text-destructive text-xs">
											{field.state.meta.errors[0].message}
										</p>
									)}
								</div>
							)}
						</form.Field>
					</div>

					<form.Field name="description">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Descripcion{" "}
										<span className="text-muted-foreground text-xs">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="text"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="imageUrl">
						{(field) => (
							<Field>
								<FieldLabel>
									Imagen del combo{" "}
									<span className="text-muted-foreground text-xs">
										(opcional)
									</span>
								</FieldLabel>
								<CatalogImageUploader
									currentPath={field.state.value}
									onUploadComplete={(path) => field.handleChange(path)}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="components" mode="array">
						{(field) => {
							const components = field.state.value;

							return (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
											Componentes del combo
										</Label>
										{components.length > 0 && (
											<Badge variant="secondary">
												{components.length}{" "}
												{components.length === 1 ? "producto" : "productos"}
											</Badge>
										)}
									</div>

									<BundleProductSearch
										addedIds={addedIds}
										onAdd={handleAddProduct}
									/>

									{components.length > 0 && (
										<div className="border-border divide-border divide-y rounded-lg border">
											{components.map((component, index) => (
												<form.Field
													key={component.productTypeId}
													name={`components[${index}].quantity`}
												>
													{(quantityField) => (
														<BundleComponentRow
															name={component.name}
															subtitle={component.subtitle}
															quantity={quantityField.state.value}
															maxQuantity={component.assetCount}
															onIncrement={() =>
																quantityField.handleChange(
																	quantityField.state.value + 1,
																)
															}
															onDecrement={() =>
																quantityField.handleChange(
																	Math.max(1, quantityField.state.value - 1),
																)
															}
															onRemove={() => field.removeValue(index)}
														/>
													)}
												</form.Field>
											))}
										</div>
									)}

									{field.state.meta.errors[0] && (
										<p className="text-destructive text-xs">
											{field.state.meta.errors[0].message}
										</p>
									)}
								</div>
							);
						}}
					</form.Field>
				</div>

				<div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button
								type="submit"
								form={formId}
								disabled={
									!hasChanges || isSaveDisabled || isSubmitting || isPending
								}
							>
								{isSubmitting || isPending ? pendingLabel : submitLabel}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}

interface BundleComponentRowProps {
	name: string;
	subtitle: string;
	quantity: number;
	maxQuantity: number;
	onIncrement: () => void;
	onDecrement: () => void;
	onRemove: () => void;
}

function BundleComponentRow({
	name,
	subtitle,
	quantity,
	maxQuantity,
	onIncrement,
	onDecrement,
	onRemove,
}: BundleComponentRowProps) {
	const atMax = quantity >= maxQuantity;
	const atMin = quantity <= 1;

	return (
		<div className="flex items-center gap-3 px-3 py-2.5">
			<div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
				<span className="text-muted-foreground text-xs font-medium uppercase">
					{name.slice(0, 2)}
				</span>
			</div>

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">{name}</p>
				<p className="text-muted-foreground truncate text-xs">{subtitle}</p>
			</div>

			<div className="flex items-center gap-1.5">
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-7"
					onClick={onDecrement}
					disabled={atMin}
					aria-label="Disminuir cantidad"
				>
					<Minus className="size-3" />
				</Button>

				<span className="w-6 text-center text-sm tabular-nums">{quantity}</span>

				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-7"
					onClick={onIncrement}
					aria-label="Aumentar cantidad"
					disabled={atMax}
				>
					<Plus className="size-3" />
				</Button>
			</div>

			<span className="text-muted-foreground w-16 text-right text-xs">
				{quantity} de {maxQuantity}
			</span>

			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="text-muted-foreground hover:text-destructive size-7"
				onClick={onRemove}
				aria-label="Quitar componente"
			>
				<Trash2 className="size-4" />
			</Button>
		</div>
	);
}

function haveComponentsChanged(
	current: BundleComponentFormValues[],
	initial: BundleComponentFormValues[],
) {
	if (current.length !== initial.length) {
		return true;
	}

	return current.some((component, index) => {
		const initialComponent = initial[index];
		if (!initialComponent) {
			return true;
		}

		return (
			component.productTypeId !== initialComponent.productTypeId ||
			component.quantity !== initialComponent.quantity
		);
	});
}

function getDirtyValues(
	values: BundleFormValues,
	defaultValues: BundleFormValues,
): Partial<BundleFormValues> {
	const dirtyValues: Partial<BundleFormValues> = {};

	if (values.name !== defaultValues.name) {
		dirtyValues.name = values.name;
	}

	if (values.billingUnitId !== defaultValues.billingUnitId) {
		dirtyValues.billingUnitId = values.billingUnitId;
	}

	if (values.imageUrl !== defaultValues.imageUrl) {
		dirtyValues.imageUrl = values.imageUrl;
	}

	if (values.description !== defaultValues.description) {
		dirtyValues.description = values.description;
	}

	if (haveComponentsChanged(values.components, defaultValues.components)) {
		dirtyValues.components = values.components;
	}

	return dirtyValues;
}
