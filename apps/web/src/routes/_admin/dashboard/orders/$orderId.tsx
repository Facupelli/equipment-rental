import { FulfillmentMethod, OrderStatus } from "@repo/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CheckCircle2,
	CircleSlash,
	Clock,
	ExternalLink,
	FileText,
	Mail,
	MapPin,
	MoreHorizontal,
	Package,
	Pencil,
	RotateCcw,
	Truck,
	User2Icon,
} from "lucide-react";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getCustomerContactName,
	getCustomerDisplayName,
	getCustomerInitials,
} from "@/features/customer/customer.utils";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { OrderBudgetCustomerDialog } from "@/features/orders/components/order-budget-customer-dialog";
import {
	OrderDetailProvider,
	useOrderDetailContext,
} from "@/features/orders/contexts/order-detail.context";
import {
	formatMoney,
	formatOrderNumber,
	getBundleSummary,
	getExternalOwnersByProductType,
	getItemQty,
	getItemSerialNumber,
	getOrderPrimaryAdminAction,
	getOrderTemporalInsight,
	getOwnerDisplay,
	type OrderTemporalState,
} from "@/features/orders/order.utils";
import { ordersListSearchSchema } from "@/features/orders/orders-list.search";
import {
	createOrderDetailQueryOptions,
	type ParsedOrderDetailResponseDto,
} from "@/features/orders/queries/get-order-by-id";
import { nowUtc } from "@/lib/dates/parse";
import { AdminRouteError } from "@/shared/components/admin-route-error";

export const Route = createFileRoute("/_admin/dashboard/orders/$orderId")({
	validateSearch: ordersListSearchSchema,
	loader: ({ context: { queryClient }, params: { orderId } }) => {
		queryClient.ensureQueryData(createOrderDetailQueryOptions({ orderId }));
	},
	errorComponent: ({ error }) => {
		return (
			<AdminRouteError
				error={error}
				genericMessage="No pudimos cargar el contenido del pedido."
				forbiddenMessage="No tienes permisos para ver el pedido."
			/>
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { orderId } = Route.useParams();
	const search = Route.useSearch();
	const { data: order } = useSuspenseQuery(
		createOrderDetailQueryOptions({ orderId }),
	);

	return (
		<OrderDetailProvider order={order}>
			<div className="min-h-screen bg-neutral-50 text-neutral-950 px-8">
				<PageBreadcrumb
					parent={{ label: "Pedidos", to: "/dashboard/orders", search }}
					current={String(order.number)}
				/>

				<OrderHeader />

				<div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] py-10 gap-20">
					{/* Left */}
					<div>
						<OrderTabs />
					</div>

					{/* Right */}
					<div className="space-y-4">
						{order.status === OrderStatus.DRAFT && (
							<DraftOrderOperationalCard />
						)}
						{order.customer && <OrderClientCard />}
						<OrderLogisticsCard />
						<OrderFinancialsCard />
					</div>
				</div>
			</div>
		</OrderDetailProvider>
	);
}

function OrderHeader() {
	const { order, actions } = useOrderDetailContext();
	const isDraft = order.status === OrderStatus.DRAFT;
	const documentLabel = isDraft ? "presupuesto" : "remito";
	const temporalInsight = getOrderTemporalInsight(
		order,
		nowUtc(),
		order.location.effectiveTimezone,
	);
	const primaryAction = getOrderPrimaryAdminAction(order.status);

	return (
		<header className="border-b border-neutral-200 pb-8">
			<div className="flex flex-col gap-6 py-4 xl:flex-row xl:items-center xl:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-3 mb-1.5">
						<div>
							<span className="uppercase text-neutral-500 text-xs">Pedido</span>
							<h1 className="text-3xl font-bold tracking-tight leading-none">
								<span>#{formatOrderNumber(order.number)}</span>
							</h1>
						</div>
					</div>
					<p className="text-sm text-neutral-400 mt-2">
						Creado el {order.createdAt.format("DD MMM, YYYY")} ·{" "}
						{order.createdAt.format("HH:mm A")}
					</p>
				</div>

				<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-end">
					<OrderStatusCard status={order.status} />
					<OperationalStateCard
						title={temporalInsight.title}
						description={temporalInsight.description}
						deadline={temporalInsight.deadline}
						state={temporalInsight.state}
					/>
					<PrimaryAdminActionButton action={primaryAction} actions={actions} />
					<OrderActionsMenu actions={actions} />
				</div>
			</div>

			<AlertDialog
				open={actions.isContractBusinessErrorOpen}
				onOpenChange={(open) => {
					if (!open) {
						actions.setContractBusinessErrorMessage(null);
					}

					actions.setIsContractBusinessErrorOpen(open);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							No se pudo generar el {documentLabel}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{actions.contractBusinessErrorMessage ??
								"No pudimos generar este documento en este momento."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => {
								actions.setContractBusinessErrorMessage(null);
								actions.setIsContractBusinessErrorOpen(false);
							}}
						>
							Entendido
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={Boolean(actions.contractError)}
				onOpenChange={(open) => {
					if (!open) {
						actions.setContractError(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{actions.contractError?.status === 404
								? "Pedido no encontrado"
								: `No se pudo ${actions.contractError?.action === "download" ? "descargar" : "abrir"} el ${documentLabel}`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{actions.contractError?.message}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => actions.setContractError(null)}>
							Cerrar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={actions.isCancelOrderDialogOpen}
				onOpenChange={actions.setIsCancelOrderDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
						<AlertDialogDescription>
							Estas por cancelar este pedido. Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>

					{actions.cancelOrderError ? (
						<p className="text-sm text-destructive">
							{actions.cancelOrderError}
						</p>
					) : null}

					<AlertDialogFooter>
						<AlertDialogCancel disabled={actions.isCancelOrderPending}>
							Volver
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={(event) => {
								event.preventDefault();
								void actions.handleConfirmCancelOrder();
							}}
							disabled={actions.isCancelOrderPending}
						>
							{actions.isCancelOrderPending ? "Cancelando..." : "Cancelar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<OrderLifecycleActionDialog actions={actions} />
			<OrderConfirmDialog actions={actions} />
			<OrderBudgetCustomerDialog
				open={actions.isBudgetCustomerDialogOpen}
				onOpenChange={actions.handleBudgetCustomerDialogOpenChange}
				onSubmit={actions.handleSubmitBudgetCustomer}
				isOpeningBudget={actions.isOpeningBudget}
				isDownloadingBudget={actions.isDownloadingBudget}
			/>
		</header>
	);
}

function OrderConfirmDialog({
	actions,
}: {
	actions: ReturnType<typeof useOrderDetailContext>["actions"];
}) {
	const { order } = useOrderDetailContext();
	const isDraft = order.status === OrderStatus.DRAFT;
	const hasCustomer = Boolean(order.customer);

	return (
		<AlertDialog
			open={actions.isConfirmOrderDialogOpen}
			onOpenChange={actions.setIsConfirmOrderDialogOpen}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isDraft ? "Confirmar borrador" : "Confirmar pedido"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isDraft
							? "Vas a confirmar este borrador con los precios ya guardados. La confirmacion no recalcula importes."
							: "Confirma este pedido para dejarlo listo para operación."}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{isDraft && !hasCustomer ? (
					<p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
						Este borrador no tiene cliente vinculado. No puede confirmarse hasta
						completar ese paso fuera de esta pantalla.
					</p>
				) : null}

				{actions.confirmOrderError ? (
					<p className="text-sm text-destructive">
						{actions.confirmOrderError}
					</p>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={actions.isConfirmOrderPending}>
						Cancelar
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(event) => {
							event.preventDefault();
							void actions.handleConfirmOrderSubmission();
						}}
						disabled={actions.isConfirmOrderPending}
					>
						{actions.isConfirmOrderPending
							? isDraft
								? "Confirmando borrador..."
								: "Confirmando pedido..."
							: isDraft
								? "Confirmar borrador"
								: "Confirmar pedido"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function OrderLifecycleActionDialog({
	actions,
}: {
	actions: ReturnType<typeof useOrderDetailContext>["actions"];
}) {
	const action = actions.pendingLifecycleAction;

	if (!action) {
		return null;
	}

	const copy =
		action === "pickup"
			? {
					title: "Marcar equipo retirado",
					description:
						"Confirma que el cliente ya retiró el equipo en la sucursal. El pedido pasará a estar activo.",
					confirmLabel: actions.isLifecycleActionPending
						? "Marcando retiro..."
						: "Marcar retirado",
				}
			: {
					title: "Marcar equipo devuelto",
					description:
						"Confirma que el cliente ya devolvió el equipo. El pedido pasará a estar completado.",
					confirmLabel: actions.isLifecycleActionPending
						? "Marcando devolucion..."
						: "Marcar devuelto",
				};

	return (
		<AlertDialog
			open={Boolean(action)}
			onOpenChange={actions.setIsLifecycleActionDialogOpen}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{copy.title}</AlertDialogTitle>
					<AlertDialogDescription>{copy.description}</AlertDialogDescription>
				</AlertDialogHeader>

				{actions.lifecycleActionError ? (
					<p className="text-sm text-destructive">
						{actions.lifecycleActionError}
					</p>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={actions.isLifecycleActionPending}>
						Cancelar
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(event) => {
							event.preventDefault();
							void actions.handleConfirmLifecycleAction();
						}}
						disabled={actions.isLifecycleActionPending}
					>
						{copy.confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const OPERATIONAL_STATE_STYLES: Record<
	OrderTemporalState,
	{ panelClassName: string; dotClassName: string }
> = {
	draft: {
		panelClassName: "border-amber-200 bg-amber-50/80",
		dotClassName: "bg-amber-500",
	},
	"pending-review": {
		panelClassName: "border-violet-200 bg-violet-50/80",
		dotClassName: "bg-violet-500",
	},
	upcoming: {
		panelClassName: "border-sky-200 bg-sky-50/80",
		dotClassName: "bg-sky-500",
	},
	active: {
		panelClassName: "border-emerald-200 bg-emerald-50/80",
		dotClassName: "bg-emerald-500",
	},
	overdue: {
		panelClassName: "border-amber-200 bg-amber-50/80",
		dotClassName: "bg-amber-500",
	},
	finished: {
		panelClassName: "border-neutral-200 bg-neutral-100/80",
		dotClassName: "bg-neutral-500",
	},
	cancelled: {
		panelClassName: "border-red-200 bg-red-50/80",
		dotClassName: "bg-red-500",
	},
	rejected: {
		panelClassName: "border-rose-200 bg-rose-50/80",
		dotClassName: "bg-rose-500",
	},
	expired: {
		panelClassName: "border-orange-200 bg-orange-50/80",
		dotClassName: "bg-orange-500",
	},
} as const;

function OperationalStateCard({
	title,
	description,
	deadline,
	state,
}: {
	title: string;
	description: string;
	deadline: string;
	state: OrderTemporalState;
}) {
	const config = OPERATIONAL_STATE_STYLES[state];

	return (
		<section
			className={`min-w-70 rounded-xl border p-2 ${config.panelClassName}`}
		>
			<div className="flex items-start gap-2">
				<span
					className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${config.dotClassName}`}
				/>
				<div className="flex items-start gap-2">
					<p className="font-semibold tracking-tight text-neutral-950">
						{title}
					</p>

					<div>
						<p className="text-sm font-medium text-neutral-700 line-clamp-1">
							{description}
						</p>
						<p className="text-xs text-neutral-500 line-clamp-1">{deadline}</p>
					</div>
				</div>
			</div>
		</section>
	);
}

function OrderStatusCard({
	status,
}: {
	status: ParsedOrderDetailResponseDto["status"];
}) {
	return (
		<section>
			<p className="mb-2 text-[10px] font-mono uppercase text-neutral-400">
				Estado del pedido
			</p>
			<div className="flex items-center">
				<OrderStatusBadge status={status} />
			</div>
		</section>
	);
}

function getPrimaryAdminButtonConfig(
	action: ReturnType<typeof getOrderPrimaryAdminAction>,
	actions: ReturnType<typeof useOrderDetailContext>["actions"],
) {
	if (!action) {
		return null;
	}

	switch (action.action) {
		case "confirm":
			return {
				icon: CheckCircle2,
				onClick: actions.handleConfirmOrder,
			};
		case "pickup":
			return {
				icon: Truck,
				onClick: actions.handleMarkAsPickedUp,
			};
		case "return":
			return {
				icon: RotateCcw,
				onClick: actions.handleMarkAsReturned,
			};
		default:
			return null;
	}
}

function PrimaryAdminActionButton({
	action,
	actions,
}: {
	action: ReturnType<typeof getOrderPrimaryAdminAction>;
	actions: ReturnType<typeof useOrderDetailContext>["actions"];
}) {
	const config = getPrimaryAdminButtonConfig(action, actions);

	if (!config) {
		return null;
	}

	const Icon = config.icon;

	return (
		<Button
			className="h-auto justify-start rounded-xl bg-emerald-600 px-4 py-2 text-left text-white hover:bg-emerald-700"
			onClick={config.onClick}
		>
			<div className="flex items-start gap-3">
				<div className="mt-0.5 rounded-full bg-white/15 p-1.5">
					<Icon className="h-4 w-4" />
				</div>
				<div>
					<p className="text-sm font-semibold leading-none">{action?.label}</p>
					<p className="mt-1 text-xs text-white/80">{action?.description}</p>
				</div>
			</div>
		</Button>
	);
}

function OrderActionsMenu({
	actions,
}: {
	actions: ReturnType<typeof useOrderDetailContext>["actions"];
}) {
	const { order } = useOrderDetailContext();
	const isDraft = order.status === OrderStatus.DRAFT;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						size="icon"
						className="px-4 rounded-sm border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
					>
						<MoreHorizontal className="size-4" />
						<span className="sr-only">Más acciones</span>
					</Button>
				}
			/>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem onClick={actions.handleEditOrder} disabled>
					<Pencil className="mr-2 h-4 w-4" />
					Editar pedido
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{isDraft ? (
					<>
						<DropdownMenuItem
							onClick={actions.handleOpenBudget}
							disabled={actions.isOpeningBudget}
						>
							<FileText className="mr-2 h-4 w-4" />
							{actions.isOpeningBudget
								? "Abriendo presupuesto..."
								: "Ver presupuesto"}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={actions.handleDownloadBudget}
							disabled={actions.isDownloadingBudget}
						>
							<FileText className="mr-2 h-4 w-4" />
							{actions.isDownloadingBudget
								? "Descargando presupuesto..."
								: "Descargar presupuesto"}
						</DropdownMenuItem>
					</>
				) : (
					<>
						<DropdownMenuItem
							onClick={actions.handleOpenContract}
							disabled={actions.isOpeningContract}
						>
							<FileText className="mr-2 h-4 w-4" />
							{actions.isOpeningContract ? "Abriendo remito..." : "Ver remito"}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={actions.handleDownloadContract}
							disabled={actions.isDownloadingContract}
						>
							<FileText className="mr-2 h-4 w-4" />
							{actions.isDownloadingContract
								? "Descargando remito..."
								: "Descargar remito"}
						</DropdownMenuItem>
					</>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={actions.handleOpenCancelOrder}
				>
					<CircleSlash className="mr-2 h-4 w-4" />
					Cancelar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function OrderTabs() {
	return (
		<Tabs defaultValue="equipment" className="flex flex-col gap-y-6">
			<TabsList>
				{(
					[
						{ value: "equipment", label: "Equipos y combos" },
						{ value: "documents", label: "Documentos" },
						{ value: "notes", label: "Notas internas" },
					] as const
				).map((tab) => (
					<TabsTrigger key={tab.value} value={tab.value}>
						{tab.label}
					</TabsTrigger>
				))}
			</TabsList>

			<TabsContent value="equipment">
				<OrderItemsTable />
				<ActivityLog />
			</TabsContent>

			<TabsContent value="documents">
				<TabPlaceholder label="No hay documentos adjuntos." />
			</TabsContent>

			<TabsContent value="notes">
				<TabPlaceholder label="Todavia no hay notas internas." />
			</TabsContent>
		</Tabs>
	);
}

function TabPlaceholder({ label }: { label: string }) {
	return (
		<div className="border border-dashed border-neutral-200 py-16 flex items-center justify-center rounded-md">
			<span className="text-sm text-neutral-300">{label}</span>
		</div>
	);
}

// ─── Items Table ──────────────────────────────────────────────────────────────

function OrderItemsTable() {
	const { order } = useOrderDetailContext();
	const { items, financial } = order;

	// Build a map from orderItemId → financial line for O(1) lookup per row
	const financialByItemId = new Map(
		financial.items.map((line) => [line.orderItemId, line]),
	);

	return (
		<section className="mb-10">
			{/* Column headers */}
			<div className="grid grid-cols-[1fr_80px_100px_100px] gap-4 pb-3 border-b border-neutral-200">
				<span className="font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-400">
					Item Description
				</span>
				<span className="font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-400 text-center">
					Quantity
				</span>
				<span className="font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-400 text-right">
					Base Price
				</span>
				<span className="font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-400 text-right">
					Total
				</span>
			</div>

			<div>
				{items.map((item) => (
					<OrderItemRow
						key={item.id}
						item={item}
						financialLine={financialByItemId.get(item.id) ?? null}
					/>
				))}
			</div>
		</section>
	);
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

// OrderItemRow still receives props: it's a repeated row inside a list,
// and each instance has its own item + financialLine data. Context would
// require passing the item id and doing a lookup inside — props are cleaner here.

function OrderItemRow({
	item,
	financialLine,
}: {
	item: ParsedOrderDetailResponseDto["items"][number];
	financialLine:
		| ParsedOrderDetailResponseDto["financial"]["items"][number]
		| null;
}) {
	const serialNumber = getItemSerialNumber(item);
	const bundleSummary = getBundleSummary(item);
	const qty = getItemQty(item);

	// For product items: show a single owner name if the asset is externally owned.
	// For bundle items: show per-product-type external ownership — getOwnerDisplay
	// would incorrectly imply the entire bundle is externally owned.
	const productOwner =
		item.type !== "BUNDLE" ? getOwnerDisplay(item.assets) : null;
	const bundleExternalOwners =
		item.type === "BUNDLE" ? getExternalOwnersByProductType(item) : [];

	return (
		<div className="grid grid-cols-[1fr_80px_100px_100px] gap-4 items-center py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors rounded-sm">
			{/* Info */}
			<div className="flex items-center gap-4">
				<div className="w-16 h-14 bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 rounded-sm">
					<Package className="w-5 h-5 text-neutral-300" />
				</div>
				<div className="flex flex-col gap-0.5 min-w-0">
					<span className="text-sm font-semibold text-neutral-950 leading-snug">
						{item.name}
					</span>

					{financialLine?.pricing.isOverridden && (
						<span className="text-[11px] font-medium text-amber-700">
							Precio ajustado manualmente
						</span>
					)}

					{/* Product item: single owner line */}
					{productOwner && (
						<span className="text-[11px] text-neutral-500 flex items-center gap-1">
							<User2Icon className="size-3 shrink-0" />
							{productOwner}
						</span>
					)}

					{/* Bundle item: one line per externally-owned product type */}
					{bundleExternalOwners.map((entry) => (
						<span
							key={entry.productTypeName}
							className="text-[11px] text-neutral-500 flex items-center gap-1"
						>
							<User2Icon className="size-3 shrink-0" />
							<span className="font-medium text-neutral-600">
								{entry.productTypeName}
							</span>
							<span className="text-neutral-400">·</span>
							{entry.ownerNames}
						</span>
					))}

					{serialNumber && (
						<span className="font-mono text-[11px] text-neutral-400">
							S/N: {serialNumber}
						</span>
					)}
					{bundleSummary && (
						<span className="text-[11px] text-neutral-500 font-medium">
							Bundle: {bundleSummary}
						</span>
					)}
				</div>
			</div>

			{/* Qty */}
			<div className="text-center">
				<span className="font-mono text-sm text-neutral-600">{qty}</span>
			</div>

			{/* Base price */}
			<div className="text-right">
				<span className="font-mono text-sm text-neutral-500">
					{financialLine ? formatMoney(financialLine.basePrice) : "—"}
				</span>
			</div>

			{/* Final price */}
			<div className="text-right">
				<span className="font-mono text-sm font-bold text-neutral-950">
					{financialLine ? formatMoney(financialLine.finalPrice) : "—"}
				</span>
			</div>
		</div>
	);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

function ActivityLog() {
	const { order } = useOrderDetailContext();

	return (
		<section>
			<div className="flex items-center gap-2 mb-5">
				<Clock className="w-4 h-4 text-neutral-400" />
				<span className="text-sm font-semibold text-neutral-950">
					Activity Log
				</span>
			</div>

			<div>
				<ActivityEntry
					label="Order created"
					timestamp={order.createdAt.format("MMM DD, YYYY [at] HH:mm")}
					actor="System"
					isLast
				/>
			</div>
		</section>
	);
}

function ActivityEntry({
	label,
	timestamp,
	actor,
	isLast = false,
}: {
	label: string;
	timestamp: string;
	actor: string;
	isLast?: boolean;
}) {
	return (
		<div className="flex items-start gap-4">
			{/* Timeline column */}
			<div className="flex flex-col items-center shrink-0 pt-1">
				<div className="w-8 h-8 rounded-full bg-neutral-950 flex items-center justify-center">
					<Clock className="w-3.5 h-3.5 text-white" />
				</div>
				{!isLast && <div className="w-px flex-1 bg-neutral-200 mt-1 min-h-6" />}
			</div>

			{/* Content */}
			<div className="flex flex-col gap-0.5 pb-6">
				<span className="text-sm font-semibold text-neutral-950">{label}</span>
				<span className="text-xs text-neutral-400">
					{timestamp} · {actor}
				</span>
			</div>
		</div>
	);
}

// ─── Client Card ──────────────────────────────────────────────────────────────

function OrderClientCard() {
	const { order } = useOrderDetailContext();

	if (!order.customer) {
		return null;
	}

	const customer = order.customer;

	const displayName = getCustomerDisplayName(customer);
	const contactName = getCustomerContactName(customer);
	const initials = getCustomerInitials(customer);

	return (
		<section className="bg-white border border-neutral-200 rounded-lg p-5">
			{/* Header */}
			<div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
				<span className="font-mono text-[10px] tracking-[0.15em] uppercase text-neutral-400">
					Información del Cliente
				</span>
				<Link
					to="/dashboard/customers/$customerId"
					params={{ customerId: customer.id }}
					className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-950 transition-colors"
				>
					Ver Perfil
					<ExternalLink className="w-3 h-3" />
				</Link>
			</div>

			{/* Avatar + name */}
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
					<span className="text-sm font-bold text-neutral-600">{initials}</span>
				</div>
				<div>
					<p className="text-sm font-bold text-neutral-950 leading-tight">
						{displayName}
					</p>
					{contactName && (
						<p className="text-xs text-neutral-400 mt-0.5">{contactName}</p>
					)}
				</div>
			</div>

			{/* Contact fields */}
			<div className="space-y-2.5">
				<SidebarField
					icon={<Mail className="w-3.5 h-3.5" />}
					value={customer.email}
				/>
			</div>
		</section>
	);
}

// ─── Logistics Card ───────────────────────────────────────────────────────────

function OrderLogisticsCard() {
	const { order } = useOrderDetailContext();
	const {
		bookingSnapshot,
		deliveryRequest,
		fulfillmentMethod,
		location,
		pickupAt,
		returnAt,
	} = order;

	return (
		<section className="bg-white border border-neutral-200 rounded-lg p-5">
			<SidebarSectionLabel label="Logistics" />

			<div className="grid grid-cols-2 gap-4 mb-4">
				<div>
					<p className="font-mono text-[9px] tracking-[0.12em] uppercase text-neutral-400 mb-1">
						Fecha de retiro
					</p>
					<p className="text-sm font-bold text-neutral-950">
						{bookingSnapshot.pickupDate.format("MMM DD, YYYY")}
					</p>
					<p className="font-mono text-[10px] text-neutral-400 mt-0.5">
						{pickupAt.tz(bookingSnapshot.timezone).format("HH:mm")}
					</p>
				</div>
				<div>
					<p className="font-mono text-[9px] tracking-[0.12em] uppercase text-neutral-400 mb-1">
						Fecha de devolución
					</p>
					<p className="text-sm font-bold text-neutral-950">
						{bookingSnapshot.returnDate.format("MMM DD, YYYY")}
					</p>
					<p className="font-mono text-[10px] text-neutral-400 mt-0.5">
						{returnAt.tz(bookingSnapshot.timezone).format("HH:mm")}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-md px-3 py-2.5">
				<MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
				<div>
					<p className="font-mono text-[9px] tracking-widest uppercase text-neutral-400 mb-0.5">
						Ubicación Depósito
					</p>
					<p className="text-sm font-semibold text-neutral-950">
						{location.name}
					</p>
				</div>
			</div>

			<div className="mt-4 flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-md px-3 py-2.5">
				<Truck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
				<div>
					<p className="font-mono text-[9px] tracking-widest uppercase text-neutral-400 mb-0.5">
						Fulfillment
					</p>
					<p className="text-sm font-semibold text-neutral-950">
						{fulfillmentMethod === FulfillmentMethod.DELIVERY
							? "Solicitó delivery"
							: "Retiro en punto de entrega"}
					</p>
				</div>
			</div>

			{deliveryRequest && (
				<div className="mt-4 rounded-md border border-neutral-200 bg-white p-4">
					<p className="font-mono text-[9px] tracking-widest uppercase text-neutral-400 mb-3">
						Pedido de Delivery
					</p>

					<div className="space-y-2 text-sm text-neutral-700">
						<p className="font-semibold text-neutral-950">
							{deliveryRequest.recipientName}
						</p>
						<p>{deliveryRequest.phone}</p>
						<p>
							{deliveryRequest.addressLine1}
							{deliveryRequest.addressLine2
								? `, ${deliveryRequest.addressLine2}`
								: ""}
						</p>
						<p>
							{deliveryRequest.city}, {deliveryRequest.stateRegion}{" "}
							{deliveryRequest.postalCode}
						</p>
						<p>{deliveryRequest.country}</p>
						{deliveryRequest.instructions && (
							<div className="rounded-md bg-neutral-50 px-3 py-2 text-neutral-600">
								{deliveryRequest.instructions}
							</div>
						)}
					</div>
				</div>
			)}
		</section>
	);
}

// ─── Financials Card ──────────────────────────────────────────────────────────

function OrderFinancialsCard() {
	const { order } = useOrderDetailContext();
	const { financial } = order;
	const hasOwnerObligations = financial.ownerObligations !== "0";

	return (
		<section className="bg-white border border-neutral-200 rounded-lg p-5">
			<SidebarSectionLabel label="Resumen financiero" />

			<div>
				{financial.items.map((line) => (
					<div key={line.orderItemId} className="border-b border-neutral-100">
						{line.pricing.isOverridden && (
							<div className="mb-2 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2">
								<span className="text-[11px] font-medium text-amber-800">
									Precio ajustado manualmente
								</span>
								<span className="font-mono text-[11px] text-amber-700">
									{formatMoney(line.finalPrice)}
								</span>
							</div>
						)}

						{/* Item label + base price */}
						<div className="flex items-center justify-between">
							<span className="text-sm text-neutral-500">{line.label}</span>
							<span
								className={`font-mono text-sm ${line.discounts.length > 0 ? "text-neutral-400" : "text-neutral-950"}`}
							>
								{formatMoney(line.basePrice)}
							</span>
						</div>

						{/* Applied discounts — only shown when discounts exist */}
						{line.discounts.length > 0 && (
							<div className="border-l border-neutral-200 pl-3 flex flex-col gap-1">
								{line.discounts.map((discount) => (
									<div
										key={`${discount.sourceId}-${discount.promotionId}-${discount.label}`}
										className="flex items-center justify-between"
									>
										<span className="text-[11px] text-neutral-400">
											{discount.label}
										</span>
										<span className="font-mono text-[11px] text-emerald-600">
											-{formatMoney(discount.discountAmount)}
										</span>
									</div>
								))}
							</div>
						)}

						{/* Final price — only shown when discounts exist, to close the math */}
						{line.discounts.length > 0 && (
							<div className="flex items-center justify-between pt-0.5">
								<span className="text-[11px] text-neutral-400">
									Después de descuentos
								</span>
								<span className="font-mono text-sm font-semibold text-neutral-950">
									{formatMoney(line.finalPrice)}
								</span>
							</div>
						)}

						{line.pricing.isOverridden && <PricingAuditSection line={line} />}

						{/* Owner split breakdown — only shown for external-owned items */}
						{line.ownerSplit && (
							<div className="border-l border-accent pb-2.5 pl-3 flex flex-col gap-1">
								{line.ownerSplit.componentName && (
									<span className="text-[10px] font-mono tracking-wide uppercase text-neutral-400 mt-0.5">
										{line.ownerSplit.componentName}
									</span>
								)}
								<div className="flex items-center justify-between">
									<span className="text-[11px] text-neutral-400">
										Propietario - {line.ownerSplit.ownerName}
									</span>
									<span className="font-mono text-[11px] text-neutral-400">
										{formatMoney(line.ownerSplit.ownerAmount)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-[11px] text-neutral-400">Renta</span>
									<span className="font-mono text-[11px] text-neutral-400">
										{formatMoney(line.ownerSplit.rentalAmount)}
									</span>
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			<div className="mt-4 border-t border-dashed border-neutral-200 pt-4">
				<div className="space-y-2">
					<FinancialSummaryRow
						label="Subtotal antes de descuentos"
						value={financial.subtotalBeforeDiscounts}
					/>
					<FinancialSummaryRow
						label="Descuentos de artículos"
						value={financial.itemsDiscountTotal}
						tone="success"
						prefix="-"
					/>
					<FinancialSummaryRow
						label="Subtotal de equipos"
						value={financial.itemsSubtotal}
					/>
					{financial.insuranceApplied && (
						<FinancialSummaryRow
							label="Seguro de equipos"
							value={financial.insuranceAmount}
						/>
					)}
				</div>
			</div>

			{/* Revenue breakdown — only shown when order has external-owned assets */}
			{hasOwnerObligations && (
				<div className="mt-3 pt-3 border-t border-dashed border-neutral-200 flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<span className="text-xs text-neutral-500">Tus ingresos</span>
						<span className="font-mono text-xs font-medium text-emerald-700">
							{formatMoney(financial.yourRevenue)}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-xs text-neutral-500">
							Obligaciones con propietarios
						</span>
						<span className="font-mono text-xs font-medium text-amber-600">
							{formatMoney(financial.ownerObligations)}
						</span>
					</div>
				</div>
			)}

			{/* Total */}
			<div className="flex items-baseline justify-between pt-4 mt-1">
				<span className="text-sm font-bold text-neutral-950">Total</span>
				<span className="font-mono text-xl font-bold text-neutral-950 tracking-tight">
					{formatMoney(financial.total)}
				</span>
			</div>
		</section>
	);
}

function DraftOrderOperationalCard() {
	const { order } = useOrderDetailContext();

	return (
		<section className="rounded-lg border border-amber-200 bg-amber-50/70 p-5">
			<p className="font-mono text-[10px] tracking-[0.15em] uppercase text-amber-700">
				Borrador persistido
			</p>
			<div className="mt-3 space-y-3 text-sm text-neutral-700">
				<p className="font-semibold text-neutral-950">
					Este pedido sigue guardado como borrador operativo.
				</p>
				<p>
					Al confirmar, se usan los precios guardados actualmente. Esta acción
					no vuelve a cotizar ni recalcula importes.
				</p>
				<p>
					{order.customer
						? "El cliente ya está vinculado y el borrador puede avanzar a confirmación."
						: "Falta vincular un cliente antes de poder confirmar este borrador."}
				</p>
				{!order.customer ? (
					<div className="rounded-md border border-amber-300 bg-white/70 px-3 py-2 text-sm font-medium text-amber-900">
						Confirmación bloqueada: este borrador no tiene cliente asociado.
					</div>
				) : null}
			</div>
		</section>
	);
}

function FinancialSummaryRow({
	label,
	value,
	tone = "default",
	prefix,
}: {
	label: string;
	value: string;
	tone?: "default" | "success";
	prefix?: string;
}) {
	const labelClassName =
		tone === "success" ? "text-sm text-green-700" : "text-sm text-neutral-500";
	const valueClassName =
		tone === "success"
			? "font-mono text-sm font-semibold text-green-700"
			: "font-mono text-sm text-neutral-950";

	return (
		<div className="flex items-center justify-between">
			<span className={labelClassName}>{label}</span>
			<span className={valueClassName}>
				{prefix}
				{formatMoney(value)}
			</span>
		</div>
	);
}

function PricingAuditSection({
	line,
}: {
	line: ParsedOrderDetailResponseDto["financial"]["items"][number];
}) {
	const manualOverride = line.pricing.manualOverride;
	const manualAdjustment = line.pricing.manualAdjustment;

	return (
		<div className="mt-2 rounded-md border border-amber-200 bg-amber-50/60 p-3">
			<p className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber-700">
				Auditoria de precio manual
			</p>
			<div className="mt-2 space-y-1.5">
				<PricingAuditRow
					label="Precio final calculado"
					value={formatMoney(line.pricing.calculated.finalPrice)}
				/>
				<PricingAuditRow
					label="Precio final efectivo"
					value={formatMoney(
						manualOverride?.finalPrice ?? line.pricing.effective.finalPrice,
					)}
				/>
				{manualAdjustment && (
					<PricingAuditRow
						label="Monto de ajuste manual"
						value={formatSignedMoney(manualAdjustment.adjustmentAmount)}
					/>
				)}
				{manualOverride?.setByUserId && (
					<PricingAuditRow
						label="Actualizado por"
						value={manualOverride.setByUserId}
					/>
				)}
				{manualOverride?.setAt && (
					<PricingAuditRow
						label="Actualizado el"
						value={manualOverride.setAt.format("MMM DD, YYYY [at] HH:mm")}
					/>
				)}
				{manualOverride?.previousFinalPrice && (
					<PricingAuditRow
						label="Precio manual previo"
						value={formatMoney(manualOverride.previousFinalPrice)}
					/>
				)}
			</div>
		</div>
	);
}

function PricingAuditRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-[11px] text-neutral-600">{label}</span>
			<span className="text-right font-mono text-[11px] text-neutral-950">
				{value}
			</span>
		</div>
	);
}

function formatSignedMoney(amount: string): string {
	const value = Number(amount);

	if (Number.isNaN(value)) {
		return formatMoney(amount);
	}

	if (value === 0) {
		return formatMoney(amount);
	}

	return `${value > 0 ? "+" : "-"}${formatMoney(String(Math.abs(value)))}`;
}

// ─── Shared Sidebar Primitives ────────────────────────────────────────────────

function SidebarSectionLabel({ label }: { label: string }) {
	return (
		<p className="font-mono text-[10px] tracking-[0.15em] uppercase text-neutral-400 mb-4 pb-3 border-b border-neutral-100">
			{label}
		</p>
	);
}

function SidebarField({
	icon,
	value,
}: {
	icon: React.ReactNode;
	value: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-neutral-400 shrink-0">{icon}</span>
			<span className="text-xs text-neutral-500">{value}</span>
		</div>
	);
}
