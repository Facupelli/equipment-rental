import type { CustomerResponseDto } from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";
import { Loader2, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/features/customer/customer.queries";
import { DraftOrderItemPicker } from "@/features/orders/draft-order/components/draft-order-item-picker";
import {
	useDraftOrderActions,
	useDraftOrderCustomer,
	useDraftOrderFulfillment,
	useDraftOrderItems,
	useDraftOrderPricing,
	useDraftOrderRentalPeriod,
} from "@/features/orders/draft-order/draft-order.context";
import { useSaveDraftOrder } from "@/features/orders/draft-order/hooks/use-save-draft-order";
import {
	getEffectiveFinalPrice,
	getManualAdjustmentAmount,
	getManualAdjustmentDirection,
	isManualOverrideActive,
	isValidNonNegativeMoneyAmount,
	normalizeMoneyAmount,
} from "@/features/orders/draft-order/utils/draft-order-pricing";
import { formatMoney } from "@/features/orders/order.utils";
import useDebounce from "@/shared/hooks/use-debounce";

export function DraftOrderComposerPage() {
	return (
		<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
			<div className="space-y-4">
				<DraftSetupSection />
				<ItemsSection />
			</div>

			<div className="space-y-4">
				<PricingSummarySection />
				<ActionsSection />
			</div>
		</div>
	);
}

function DraftSetupSection() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Draft setup</CardTitle>
				<CardDescription>
					Cliente opcional, periodo compartido y logística base para todo el
					pedido.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8">
				<CustomerLinkSection />
				<RentalPeriodSection />
				<FulfillmentSection />
			</CardContent>
		</Card>
	);
}

function CustomerLinkSection() {
	const { customer, setCustomer, loadDemoCustomer, clearCustomer } =
		useDraftOrderCustomer();
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);
	const normalizedSearch = debouncedSearch.trim();
	const shouldSearchCustomers = normalizedSearch.length > 0;
	const { data, isFetching, isError } = useCustomers(
		{
			page: 1,
			limit: 5,
			search: shouldSearchCustomers ? normalizedSearch : null,
			onboardingStatus: null,
			isActive: null,
			isCompany: null,
		},
		{
			enabled: shouldSearchCustomers,
		},
	);
	const customerResults = data?.data ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<h2 className="text-base font-semibold">Customer</h2>
					<p className="text-sm text-muted-foreground">
						Podés crear el borrador sin cliente y vincularlo más tarde.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="outline" onClick={loadDemoCustomer}>
						Cargar cliente demo
					</Button>
					{customer ? (
						<Button type="button" variant="ghost" onClick={clearCustomer}>
							Limpiar cliente
						</Button>
					) : null}
				</div>
			</div>

			{customer ? (
				<div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4">
					<div className="min-w-0 space-y-1">
						<p className="font-medium">{customer.displayName}</p>
						<p className="text-sm text-muted-foreground break-all">
							{customer.id}
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={clearCustomer}
					>
						<X className="size-4" />
						Quitar
					</Button>
				</div>
			) : (
				<div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
					<UserRound className="size-4 shrink-0" />
					<span>Sin cliente vinculado.</span>
				</div>
			)}

			<div className="space-y-2">
				<div className="relative">
					<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
					{isFetching ? (
						<Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
					) : null}
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Buscar cliente por nombre, empresa o email"
						className="pl-9"
					/>
				</div>

				{shouldSearchCustomers ? (
					isError ? (
						<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
							No pudimos buscar clientes en este momento.
						</div>
					) : customerResults.length > 0 ? (
						<div className="space-y-2 rounded-lg border border-border bg-background p-2">
							{customerResults.map((result) => (
								<CustomerSearchResultRow
									key={result.id}
									customer={result}
									onSelect={() => {
										setCustomer({
											id: result.id,
											displayName: getCustomerDisplayName(result),
										});
										setSearch("");
									}}
								/>
							))}
						</div>
					) : (
						<div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
							No se encontraron clientes para &quot;{normalizedSearch}&quot;.
						</div>
					)
				) : (
					<p className="text-sm text-muted-foreground">
						Escribí para buscar y vincular un cliente opcionalmente.
					</p>
				)}
			</div>
		</div>
	);
}

function RentalPeriodSection() {
	const {
		rentalPeriod,
		setRentalPeriodField,
		loadDemoPeriod,
		clearRentalPeriod,
	} = useDraftOrderRentalPeriod();

	return (
		<div className="space-y-4 border-t pt-8">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<h2 className="text-base font-semibold">Rental period</h2>
					<p className="text-sm text-muted-foreground">
						Este periodo se compartirá entre todos los items del futuro draft.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="outline" onClick={loadDemoPeriod}>
						Cargar periodo demo
					</Button>
					<Button type="button" variant="ghost" onClick={clearRentalPeriod}>
						Limpiar periodo
					</Button>
				</div>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<PeriodField
					label="Pickup date"
					type="date"
					value={rentalPeriod.pickupDate ?? ""}
					onChange={(value) =>
						setRentalPeriodField("pickupDate", value || null)
					}
				/>
				<PeriodField
					label="Return date"
					type="date"
					value={rentalPeriod.returnDate ?? ""}
					onChange={(value) =>
						setRentalPeriodField("returnDate", value || null)
					}
				/>
				<PeriodField
					label="Pickup time"
					type="time"
					value={minutesToTimeInput(rentalPeriod.pickupTime)}
					onChange={(value) =>
						setRentalPeriodField("pickupTime", timeInputToMinutes(value))
					}
				/>
				<PeriodField
					label="Return time"
					type="time"
					value={minutesToTimeInput(rentalPeriod.returnTime)}
					onChange={(value) =>
						setRentalPeriodField("returnTime", timeInputToMinutes(value))
					}
				/>
			</div>
		</div>
	);
}

function FulfillmentSection() {
	const {
		fulfillmentMethod,
		deliveryRequest,
		setFulfillmentMethod,
		setDeliveryRequestField,
	} = useDraftOrderFulfillment();

	return (
		<div className="space-y-4 border-t pt-8">
			<div className="space-y-1">
				<h2 className="text-base font-semibold">Fulfillment</h2>
				<p className="text-sm text-muted-foreground">
					Si elegís entrega, el draft necesita un delivery request completo.
				</p>
			</div>

			<RadioGroup
				value={fulfillmentMethod}
				onValueChange={(value) =>
					setFulfillmentMethod(value as FulfillmentMethod)
				}
				className="grid gap-3 md:grid-cols-2"
			>
				<FulfillmentMethodOption
					value={FulfillmentMethod.PICKUP}
					label="Pickup"
					description="No incluye delivery request en el payload local."
				/>
				<FulfillmentMethodOption
					value={FulfillmentMethod.DELIVERY}
					label="Delivery"
					description="Solicita dirección y datos del destinatario."
				/>
			</RadioGroup>

			{fulfillmentMethod === FulfillmentMethod.DELIVERY ? (
				<div className="grid gap-3 md:grid-cols-2">
					<DeliveryField
						label="Recipient name"
						value={deliveryRequest?.recipientName ?? ""}
						onChange={(value) =>
							setDeliveryRequestField("recipientName", value)
						}
					/>
					<DeliveryField
						label="Phone"
						value={deliveryRequest?.phone ?? ""}
						onChange={(value) => setDeliveryRequestField("phone", value)}
					/>
					<DeliveryField
						label="Address line 1"
						value={deliveryRequest?.addressLine1 ?? ""}
						onChange={(value) => setDeliveryRequestField("addressLine1", value)}
					/>
					<DeliveryField
						label="Address line 2"
						value={deliveryRequest?.addressLine2 ?? ""}
						onChange={(value) => setDeliveryRequestField("addressLine2", value)}
					/>
					<DeliveryField
						label="City"
						value={deliveryRequest?.city ?? ""}
						onChange={(value) => setDeliveryRequestField("city", value)}
					/>
					<DeliveryField
						label="State / region"
						value={deliveryRequest?.stateRegion ?? ""}
						onChange={(value) => setDeliveryRequestField("stateRegion", value)}
					/>
					<DeliveryField
						label="Postal code"
						value={deliveryRequest?.postalCode ?? ""}
						onChange={(value) => setDeliveryRequestField("postalCode", value)}
					/>
					<DeliveryField
						label="Country"
						value={deliveryRequest?.country ?? ""}
						onChange={(value) => setDeliveryRequestField("country", value)}
					/>
					<div className="space-y-2 md:col-span-2">
						<p className="text-sm font-medium">Instructions</p>
						<Textarea
							value={deliveryRequest?.instructions ?? ""}
							onChange={(event) =>
								setDeliveryRequestField("instructions", event.target.value)
							}
							placeholder="Indicaciones opcionales para la entrega"
						/>
					</div>
				</div>
			) : (
				<p className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
					El draft está configurado para pickup, así que no mantiene delivery
					request en memoria.
				</p>
			)}
		</div>
	);
}

function ItemsSection() {
	const { items, removeItem, setItemManualOverride } = useDraftOrderItems();
	const { pricingByItemId } = useDraftOrderPricing();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Items</CardTitle>
				<CardDescription>
					Buscá items disponibles para este contexto y agregalos al borrador con
					pricing calculado como baseline local.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<DraftOrderItemPicker />

				{items.length === 0 ? (
					<div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
						Todavía no hay items en el borrador local.
					</div>
				) : (
					<div className="rounded-lg border border-border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Item</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead>Cantidad</TableHead>
									<TableHead>Pricing</TableHead>
									<TableHead>Override manual</TableHead>
									<TableHead className="text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => {
									const pricing = pricingByItemId[item.draftItemId];

									return (
										<TableRow key={item.draftItemId}>
											<TableCell>
												<div className="space-y-1">
													<p className="font-medium">{item.selection.label}</p>
													{isManualOverrideActive(item) ? (
														<p className="text-xs font-medium text-amber-700">
															Precio ajustado manualmente
														</p>
													) : (
														<p className="text-xs text-muted-foreground">
															Usando pricing calculado
														</p>
													)}
												</div>
											</TableCell>
											<TableCell>
												{item.selection.type === "PRODUCT"
													? "Producto"
													: "Combo"}
											</TableCell>
											<TableCell>
												{item.selection.type === "PRODUCT"
													? String(item.selection.quantity)
													: "-"}
											</TableCell>
											<TableCell>
												<ItemPricingSummary item={item} />
											</TableCell>
											<TableCell>
												<ManualOverrideEditor
													item={item}
													effectiveFinalPrice={
														pricing?.effectiveFinalPrice ??
														getEffectiveFinalPrice(item)
													}
													onCommit={(finalPrice) =>
														setItemManualOverride(item.draftItemId, finalPrice)
													}
												/>
											</TableCell>
											<TableCell className="text-right">
												<Button
													type="button"
													variant="ghost"
													onClick={() => removeItem(item.draftItemId)}
												>
													Quitar
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}

				<p className="text-sm text-muted-foreground">
					El snapshot calculado queda fijo. Cualquier cambio del admin vive en
					la capa de override manual y redefine el precio efectivo mostrado.
				</p>
			</CardContent>
		</Card>
	);
}

function PricingSummarySection() {
	const { currency, totals } = useDraftOrderPricing();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Pricing summary</CardTitle>
				<CardDescription>
					La vista usa override manual si existe; si no, muestra el snapshot
					calculado.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
					<SummaryRow
						label="Subtotal calculado"
						value={formatMoney(totals.calculatedSubtotal, currency)}
					/>
					<SummaryRow
						label="Subtotal efectivo"
						value={formatMoney(totals.effectiveSubtotal, currency)}
					/>
					<SummaryRow
						label="Overrides manuales"
						value={
							totals.hasManualOverrides
								? `${totals.manualOverrideCount} activos`
								: "Sin overrides"
						}
					/>
					<SummaryRow
						label="Ajuste manual total"
						value={formatSignedMoney(
							totals.manualAdjustmentTotal,
							totals.manualAdjustmentDirection,
							currency,
						)}
					/>
				</div>

				<ProposalPlaceholder currency={currency} />
			</CardContent>
		</Card>
	);
}

function ActionsSection() {
	const { isReadyForSave, itemCount, resetDraft } = useDraftOrderActions();
	const { customer } = useDraftOrderCustomer();
	const { rentalPeriod } = useDraftOrderRentalPeriod();
	const { fulfillmentMethod } = useDraftOrderFulfillment();
	const { handleSaveDraft, saveError, isSaving, hasManualOverrides } =
		useSaveDraftOrder();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Actions</CardTitle>
				<CardDescription>
					Acciones locales solamente. El draft sigue en memoria hasta
					implementar `Save draft`.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4 text-sm">
					<SummaryRow
						label="Cliente"
						value={customer?.displayName || "Sin seleccionar"}
					/>
					<SummaryRow label="Items" value={String(itemCount)} />
					<SummaryRow label="Fulfillment" value={fulfillmentMethod} />
					<SummaryRow
						label="Pickup"
						value={
							rentalPeriod.pickupDate && rentalPeriod.pickupTime !== null
								? `${rentalPeriod.pickupDate} ${minutesToTimeInput(rentalPeriod.pickupTime)}`
								: "Pendiente"
						}
					/>
				</div>

				{saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}

				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						onClick={() => void handleSaveDraft()}
						disabled={isSaving}
					>
						{isSaving ? "Guardando..." : "Save draft"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={resetDraft}
						disabled={isSaving}
					>
						Reset local draft
					</Button>
				</div>

				<p className="text-sm text-muted-foreground">
					{isReadyForSave
						? hasManualOverrides
							? "Al guardar se crea el draft y luego se persisten los overrides manuales por item."
							: "El borrador ya tiene la forma minima para guardarse sin pasos extra de pricing."
						: "Falta completar periodo o items antes de pensar en guardar."}
				</p>
			</CardContent>
		</Card>
	);
}

function CustomerSearchResultRow({
	customer,
	onSelect,
}: {
	customer: CustomerResponseDto;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className="hover:bg-muted/60 flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors"
		>
			<div className="min-w-0 space-y-1">
				<p className="truncate text-sm font-medium">
					{getCustomerDisplayName(customer)}
				</p>
				<p className="truncate text-xs text-muted-foreground">
					{customer.email}
				</p>
			</div>
			<span className="text-xs font-medium text-primary">Vincular</span>
		</button>
	);
}

function FulfillmentMethodOption({
	value,
	label,
	description,
}: {
	value: FulfillmentMethod;
	label: string;
	description: string;
}) {
	const id = `fulfillment-${value.toLowerCase()}`;

	return (
		<label
			htmlFor={id}
			className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/10 p-4 transition-colors hover:bg-muted/20"
		>
			<RadioGroupItem id={id} value={value} />
			<div className="space-y-1">
				<p className="text-sm font-medium">{label}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
		</label>
	);
}

function DeliveryField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return <LabeledInput label={label} value={value} onChange={onChange} />;
}

function PeriodField({
	label,
	type,
	value,
	onChange,
}: {
	label: string;
	type: "date" | "time";
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">{label}</p>
			<Input
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
}

function LabeledInput({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">{label}</p>
			<Input value={value} onChange={(event) => onChange(event.target.value)} />
		</div>
	);
}

function ItemPricingSummary({
	item,
}: {
	item: ReturnType<typeof useDraftOrderItems>["items"][number];
}) {
	const currency = item.pricingSnapshot.currency;
	const effectiveFinalPrice = getEffectiveFinalPrice(item);
	const hasCalculatedDiscount = item.pricingSnapshot.discountTotal !== "0.00";
	const hasManualOverride = isManualOverrideActive(item);
	const manualAdjustmentAmount = getManualAdjustmentAmount(item);
	const manualAdjustmentDirection = getManualAdjustmentDirection(item);

	return (
		<div className="space-y-3 text-sm">
			<div className="space-y-1">
				<PricingLine
					label="Base"
					value={formatMoney(item.pricingSnapshot.basePrice, currency)}
				/>
				{hasCalculatedDiscount ? (
					<PricingLine
						label="Descuento calculado"
						value={`-${formatMoney(item.pricingSnapshot.discountTotal, currency)}`}
						tone="success"
					/>
				) : null}
				<PricingLine
					label="Final calculado"
					value={formatMoney(item.pricingSnapshot.finalPrice, currency)}
				/>
			</div>

			<div
				className={
					hasManualOverride
						? "rounded-md border border-amber-200 bg-amber-50/70 p-3"
						: "rounded-md border border-border bg-muted/20 p-3"
				}
			>
				<PricingLine
					label="Precio efectivo"
					value={formatMoney(effectiveFinalPrice, currency)}
					valueClassName="font-semibold"
				/>
				<p className="mt-1 text-xs text-muted-foreground">
					{hasManualOverride
						? "Se muestra el override manual por encima del snapshot calculado."
						: "Todavía coincide con el pricing calculado."}
				</p>
				{hasManualOverride && manualAdjustmentDirection !== "NONE" ? (
					<p
						className={`mt-2 text-xs font-medium ${manualAdjustmentDirection === "DISCOUNT" ? "text-emerald-700" : "text-amber-700"}`}
					>
						{manualAdjustmentDirection === "DISCOUNT"
							? `Descuento manual: -${formatMoney(manualAdjustmentAmount, currency)}`
							: `Recargo manual: +${formatMoney(manualAdjustmentAmount, currency)}`}
					</p>
				) : null}
			</div>
		</div>
	);
}

function ManualOverrideEditor({
	item,
	effectiveFinalPrice,
	onCommit,
}: {
	item: ReturnType<typeof useDraftOrderItems>["items"][number];
	effectiveFinalPrice: string;
	onCommit: (finalPrice: string | null) => void;
}) {
	const [value, setValue] = useState(
		item.manualOverride?.finalPrice ?? item.pricingSnapshot.finalPrice,
	);
	const [error, setError] = useState<string | null>(null);
	const hasManualOverride = isManualOverrideActive(item);

	function applyValue() {
		const trimmed = value.trim();

		if (!trimmed) {
			onCommit(null);
			setValue(item.pricingSnapshot.finalPrice);
			setError(null);
			return;
		}

		if (!isValidNonNegativeMoneyAmount(trimmed)) {
			setError("Ingresá un monto valido mayor o igual a 0.00.");
			return;
		}

		const normalizedValue = normalizeMoneyAmount(trimmed);

		if (!normalizedValue) {
			setError("Ingresá un monto valido mayor o igual a 0.00.");
			return;
		}

		onCommit(normalizedValue);
		setValue(
			normalizedValue === item.pricingSnapshot.finalPrice
				? item.pricingSnapshot.finalPrice
				: normalizedValue,
		);
		setError(null);
	}

	function clearOverride() {
		onCommit(null);
		setValue(item.pricingSnapshot.finalPrice);
		setError(null);
	}

	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
					Final manual
				</p>
				<Input
					inputMode="decimal"
					value={value}
					onChange={(event) => {
						setValue(event.target.value);
						if (error) {
							setError(null);
						}
					}}
					onBlur={applyValue}
					placeholder={item.pricingSnapshot.finalPrice}
				/>
				<p className="text-xs text-muted-foreground">
					Efectivo actual:{" "}
					{formatMoney(effectiveFinalPrice, item.pricingSnapshot.currency)}
				</p>
				{error ? <p className="text-xs text-destructive">{error}</p> : null}
			</div>

			<div className="flex flex-wrap gap-2">
				<Button type="button" size="sm" variant="outline" onClick={applyValue}>
					Aplicar
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={clearOverride}
					disabled={!hasManualOverride}
				>
					Limpiar
				</Button>
			</div>
		</div>
	);
}

function ProposalPlaceholder({ currency }: { currency: string }) {
	return (
		<div className="space-y-4 rounded-lg border border-dashed border-border bg-muted/10 p-4">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold">Proposal flow</h3>
				<p className="text-sm text-muted-foreground">
					La distribucion proporcional del target total sigue reservada al
					backend. Esta vista todavia no la ejecuta mientras el draft sea local
					y no persistido.
				</p>
			</div>

			<div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
				<div className="space-y-2">
					<p className="text-sm font-medium">Target total</p>
					<Input value={formatMoney("0.00", currency)} disabled />
				</div>
				<Button type="button" disabled>
					Generar propuesta
				</Button>
			</div>

			<p className="text-xs text-muted-foreground">
				Se conectara cuando exista un endpoint de propuesta para drafts no
				persistidos, o despues de `Save draft` en una revision posterior del
				flujo.
			</p>
		</div>
	);
}

function PricingLine({
	label,
	value,
	tone = "default",
	valueClassName,
}: {
	label: string;
	value: string;
	tone?: "default" | "success";
	valueClassName?: string;
}) {
	const toneClassName =
		tone === "success" ? "text-emerald-700" : "text-muted-foreground";

	return (
		<div className="flex items-center justify-between gap-3">
			<span className={`text-xs ${toneClassName}`}>{label}</span>
			<span className={`text-right text-sm ${valueClassName ?? "font-medium"}`}>
				{value}
			</span>
		</div>
	);
}

function formatSignedMoney(
	amount: string,
	direction: "DISCOUNT" | "SURCHARGE" | "NONE",
	currency: string,
) {
	const formattedAmount = formatMoney(amount, currency);

	if (direction === "DISCOUNT") {
		return `-${formattedAmount}`;
	}

	if (direction === "SURCHARGE") {
		return `+${formattedAmount}`;
	}

	return formattedAmount;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium text-right">{value}</span>
		</div>
	);
}

function getCustomerDisplayName(customer: CustomerResponseDto): string {
	const fullName = `${customer.firstName} ${customer.lastName}`.trim();

	if (customer.isCompany && customer.companyName) {
		return `${customer.companyName} (${fullName})`;
	}

	return fullName || customer.email;
}

function minutesToTimeInput(value: number | null): string {
	if (value === null) {
		return "";
	}

	const hours = String(Math.floor(value / 60)).padStart(2, "0");
	const minutes = String(value % 60).padStart(2, "0");

	return `${hours}:${minutes}`;
}

function timeInputToMinutes(value: string): number | null {
	if (!value) {
		return null;
	}

	const [hours, minutes] = value.split(":").map(Number);

	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		return null;
	}

	return hours * 60 + minutes;
}
