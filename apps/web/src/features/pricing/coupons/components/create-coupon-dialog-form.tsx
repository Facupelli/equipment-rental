import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { useCreateCoupon } from "../coupons.queries";
import { usePricingRules } from "../../pricing-rules/pricing-rules.queries";
import { PricingRuleType } from "@repo/types";
import {
	couponFormDefaults,
	couponFormSchema,
	toCreateCouponDto,
} from "../schemas/create-coupon-form.schema";
import { Plus } from "lucide-react";
import { useState } from "react";

const formId = "create-coupon";

export function CreateCouponDialogForm() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const { mutateAsync: createCoupon, isPending } = useCreateCoupon();

	const { data: couponRules } = usePricingRules({
		type: PricingRuleType.COUPON,
		limit: 100,
		page: 1,
	});

	const form = useForm({
		defaultValues: couponFormDefaults,
		validators: {
			onSubmit: couponFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const dto = toCreateCouponDto(value);
				await createCoupon(dto);
				setIsDialogOpen(false);
			} catch (error) {
				console.log({ error });
			}
		},
	});

	function handleOpenChange(nextOpen: boolean) {
		form.reset();
		setIsDialogOpen(nextOpen);
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger
				render={
					<Button className="shrink-0 gap-2" type="button">
						<Plus className="h-4 w-4" />
						Nuevo Cupón
					</Button>
				}
			/>

			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Nuevo Cupón</DialogTitle>
					<DialogDescription>
						Configura las restricciones y validez del nuevo código promocional.
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
					{/* Code */}
					<FieldGroup>
						<form.Field
							name="code"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Código del Cupón
										</FieldLabel>
										<Input
											id={field.name}
											placeholder="Ej: BLACKFRIDAY24"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(e.target.value.toUpperCase())
											}
											aria-invalid={isInvalid}
											className="font-mono"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>
					</FieldGroup>

					{/* Pricing Rule */}
					<form.Field
						name="pricingRuleId"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel>Regla de Precio</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(value) => {
											if (value) field.handleChange(value);
										}}
										items={couponRules?.data.map((rule) => ({
											value: rule.id,
											label: rule.name,
										}))}
									>
										<SelectTrigger aria-invalid={isInvalid}>
											<SelectValue placeholder="Selecciona una regla tipo COUPON..." />
										</SelectTrigger>
										<SelectContent>
											{couponRules?.data.map((rule) => (
												<SelectItem key={rule.id} value={rule.id}>
													{rule.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>

					{/* Max uses */}
					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="maxUses"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Límite de Usos Totales
										</FieldLabel>
										<Input
											id={field.name}
											type="number"
											min={1}
											placeholder="Sin límite"
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
						/>

						<form.Field
							name="maxUsesPerCustomer"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Límite por Cliente
										</FieldLabel>
										<Input
											id={field.name}
											type="number"
											min={1}
											placeholder="Ej: 1"
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
						/>
					</div>

					{/* Restricted to customer */}
					<FieldGroup>
						<form.Field
							name="restrictedToCustomerId"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Restringido a Cliente Específico
										</FieldLabel>
										<Input
											id={field.name}
											placeholder="Buscar nombre o correo de cliente..."
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
						/>
					</FieldGroup>

					{/* Validity range */}
					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="validFrom"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Válido Desde</FieldLabel>
										<Input
											id={field.name}
											type="date"
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
						/>

						<form.Field
							name="validUntil"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Válido Hasta</FieldLabel>
										<Input
											id={field.name}
											type="date"
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
						/>
					</div>
				</form>

				<DialogFooter>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => (
							<>
								<Button
									type="button"
									variant="outline"
									onClick={() => handleOpenChange(false)}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									form={formId}
									disabled={!canSubmit || isPending}
								>
									{isSubmitting || isPending ? "Creando..." : "Crear Cupón"}
								</Button>
							</>
						)}
					/>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
