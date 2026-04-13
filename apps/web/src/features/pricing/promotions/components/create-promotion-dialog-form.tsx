import { PricingRuleEffectType, PromotionType } from "@repo/types";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Plus } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreatePromotion } from "../promotions.mutations";
import {
	defaultConditionFor,
	promotionFormDefaults,
	promotionFormSchema,
	toCreatePromotionDto,
} from "../schemas/promotion-form.schema";

const formId = "create-promotion";

const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
	[PromotionType.COUPON]: "Cupón",
	[PromotionType.SEASONAL]: "Estacional",
	[PromotionType.CUSTOMER_SPECIFIC]: "Cliente específico",
};

const EFFECT_TYPE_LABELS: Record<PricingRuleEffectType, string> = {
	[PricingRuleEffectType.PERCENTAGE]: "Porcentaje (%)",
	[PricingRuleEffectType.FLAT]: "Monto fijo ($)",
};

export function CreatePromotionDialogForm() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
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
						Nueva promoción
					</Button>
				}
			/>

			<DialogContent className="max-h-svh overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Nueva promoción</DialogTitle>
					<DialogDescription>
						Crea un descuento comercial, estacional o específico por cliente.
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
											Nombre de la promoción
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

						<form.Field name="type">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>Tipo de promoción</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												const next = value as PromotionType;
												field.handleChange(next);
												form.setFieldValue(
													"condition",
													defaultConditionFor(next),
												);
											}}
										>
											<SelectTrigger aria-invalid={isInvalid}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Object.values(PromotionType).map((type) => (
													<SelectItem key={type} value={type}>
														{PROMOTION_TYPE_LABELS[type]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<div className="grid gap-4 sm:grid-cols-2">
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

							<form.Field name="stackable">
								{(field) => (
									<Field>
										<div className="flex items-center justify-between rounded-lg border px-4 py-3">
											<div>
												<FieldLabel htmlFor={field.name}>Acumulable</FieldLabel>
												<FieldDescription>
													Si está activa, esta promoción puede combinarse con
													otras.
												</FieldDescription>
											</div>
											<Switch
												id={field.name}
												checked={field.state.value}
												onCheckedChange={field.handleChange}
											/>
										</div>
									</Field>
								)}
							</form.Field>
						</div>

						<form.Subscribe selector={(state) => state.values.type}>
							{(type) => <ConditionSection type={type} form={form} />}
						</form.Subscribe>

						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="effect.type">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel>Tipo de descuento</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={(value) =>
													field.handleChange(value as PricingRuleEffectType)
												}
											>
												<SelectTrigger aria-invalid={isInvalid}>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{Object.values(PricingRuleEffectType).map((type) => (
														<SelectItem key={type} value={type}>
															{EFFECT_TYPE_LABELS[type]}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							</form.Field>

							<form.Field name="effect.value">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												Valor del descuento
											</FieldLabel>
											<Input
												id={field.name}
												type="number"
												min={0}
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
							{isPending ? "Creando..." : "Crear promoción"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function ConditionSection({ type, form }: ConditionSectionProps) {
	if (type === PromotionType.COUPON) {
		return (
			<div className="rounded-lg border bg-muted/40 p-4">
				<p className="text-sm font-medium">Condición</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Las promociones de tipo cupón se activan cuando se aplica un cupón. El
					código del cupón se gestiona por separado.
				</p>
			</div>
		);
	}

	if (type === PromotionType.SEASONAL) {
		return (
			<div className="rounded-lg border bg-muted/40 p-4">
				<p className="mb-4 text-sm font-medium">Condición estacional</p>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.Field name="condition.dateFrom">
						{(field: any) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Fecha desde</FieldLabel>
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
					<form.Field name="condition.dateTo">
						{(field: any) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Fecha hasta</FieldLabel>
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
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border bg-muted/40 p-4">
			<p className="mb-4 text-sm font-medium">Cliente objetivo</p>
			<form.Field name="condition.customerId">
				{(field: any) => {
					const isInvalid =
						field.state.meta.isTouched && !field.state.meta.isValid;

					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor={field.name}>ID del cliente</FieldLabel>
							<Input
								id={field.name}
								placeholder="UUID del cliente"
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
		</div>
	);
}

interface ConditionSectionProps {
	type: PromotionType;
	form: any;
}
