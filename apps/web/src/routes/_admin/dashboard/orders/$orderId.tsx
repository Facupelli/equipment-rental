import {
  createOrderDetailQueryOptions,
  type ParsedOrderDetailResponseDto,
} from "@/features/orders/queries/get-order-by-id";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Pencil,
  Mail,
  MapPin,
  Clock,
  Package,
  ExternalLink,
  User2Icon,
} from "lucide-react";
import {
  formatDiscountLine,
  formatMoney,
  formatOrderNumber,
  getExternalOwnersByProductType,
} from "@/features/orders/order.utils";
import {
  getItemSerialNumber,
  getItemQty,
  getBundleSummary,
  getOwnerDisplay,
} from "@/features/orders/order.utils";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";
import {
  OrderDetailProvider,
  useOrderDetailContext,
} from "@/features/orders/contexts/order-detail.context";
import {
  getCustomerContactName,
  getCustomerDisplayName,
  getCustomerInitials,
} from "@/features/customer/customer.utils";
import { AdminRouteError } from "@/shared/components/admin-route-error";

export const Route = createFileRoute("/_admin/dashboard/orders/$orderId")({
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
  const { data: order } = useSuspenseQuery(
    createOrderDetailQueryOptions({ orderId }),
  );

  return (
    <OrderDetailProvider order={order}>
      <div className="min-h-screen bg-neutral-50 text-neutral-950 px-8">
        <PageBreadcrumb
          parent={{ label: "Pedidos", to: "/dashboard/schedule" }}
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

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="flex items-start justify-between gap-6">
        {/* Title + meta */}
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-3xl font-bold tracking-tight leading-none">
              Order <span>#{formatOrderNumber(order.number)}</span>
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            Created on {order.createdAt.format("MMM DD, YYYY")} ·{" "}
            {order.createdAt.format("HH:mm A")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-sm text-neutral-700 border-neutral-300 hover:bg-neutral-100 rounded-md h-9 px-4"
            onClick={actions.handlePrintPdf}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Print PDF
          </Button>
          <Button
            size="sm"
            className="text-sm rounded-md bg-neutral-950 text-white hover:bg-neutral-800 h-9 px-4"
            onClick={actions.handleEditOrder}
          >
            <Pencil className="w-4 h-4 mr-1.5" />
            Edit Order
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function OrderTabs() {
  return (
    <Tabs defaultValue="equipment" className="flex flex-col gap-y-6">
      <TabsList>
        {(
          [
            { value: "equipment", label: "Equipment & Bundles" },
            { value: "documents", label: "Documents" },
            { value: "notes", label: "Internal Notes" },
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
        <TabPlaceholder label="No documents attached." />
      </TabsContent>

      <TabsContent value="notes">
        <TabPlaceholder label="No internal notes yet." />
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
          {financialLine ? `${financialLine.basePrice}` : `—`}
        </span>
      </div>

      {/* Final price */}
      <div className="text-right">
        <span className="font-mono text-sm font-bold text-neutral-950">
          {financialLine ? `${financialLine.finalPrice}` : `—`}
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

  // Guarded by the conditional render in OrderDetailPage
  const customer = order.customer!;

  const displayName = getCustomerDisplayName(customer);
  const contactName = getCustomerContactName(customer);
  const initials = getCustomerInitials(customer);

  return (
    <section className="bg-white border border-neutral-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-neutral-400">
          Customer Information
        </span>
        <Link
          to="/dashboard/customers/$customerId"
          params={{ customerId: customer.id }}
          className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-950 transition-colors"
        >
          View Profile
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
  const { location, period } = order;

  return (
    <section className="bg-white border border-neutral-200 rounded-lg p-5">
      <SidebarSectionLabel label="Logistics" />

      {period && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-neutral-400 mb-1">
              Pickup Date
            </p>
            <p className="text-sm font-bold text-neutral-950">
              {period.start.format("MMM DD, YYYY")}
            </p>
            <p className="font-mono text-[10px] text-neutral-400 mt-0.5">
              {period.start.format("HH:mm")}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-neutral-400 mb-1">
              Return Date
            </p>
            <p className="text-sm font-bold text-neutral-950">
              {period.end.format("MMM DD, YYYY")}
            </p>
            <p className="font-mono text-[10px] text-neutral-400 mt-0.5">
              {period.end.format("HH:mm")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-md px-3 py-2.5">
        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-neutral-400 mb-0.5">
            Location
          </p>
          <p className="text-sm font-semibold text-neutral-950">
            {location.name}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Financials Card ──────────────────────────────────────────────────────────

function OrderFinancialsCard() {
  const { order, actions } = useOrderDetailContext();
  const { financial } = order;
  const hasOwnerObligations = financial.ownerObligations !== "0";

  return (
    <section className="bg-white border border-neutral-200 rounded-lg p-5">
      <SidebarSectionLabel label="Financial Summary" />

      <div>
        {financial.items.map((line, i) => (
          <div key={i} className="border-b border-neutral-100">
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
                    key={discount.ruleId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[11px] text-neutral-400">
                      {formatDiscountLine(discount)}
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
                  After discounts
                </span>
                <span className="font-mono text-sm font-semibold text-neutral-950">
                  {formatMoney(line.finalPrice)}
                </span>
              </div>
            )}

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
                    Owner — {line.ownerSplit.ownerName}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-400">
                    {formatMoney(line.ownerSplit.ownerAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Rental</span>
                  <span className="font-mono text-[11px] text-neutral-400">
                    {formatMoney(line.ownerSplit.rentalAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue breakdown — only shown when order has external-owned assets */}
      {hasOwnerObligations && (
        <div className="mt-3 pt-3 border-t border-dashed border-neutral-200 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Your Revenue</span>
            <span className="font-mono text-xs font-medium text-emerald-700">
              {formatMoney(financial.yourRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Owner Obligations</span>
            <span className="font-mono text-xs font-medium text-amber-600">
              {formatMoney(financial.ownerObligations)}
            </span>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="flex items-baseline justify-between pt-4 mt-1">
        <span className="text-sm font-bold text-neutral-950">Total Amount</span>
        <span className="font-mono text-xl font-bold text-neutral-950 tracking-tight">
          {formatMoney(financial.total)}
        </span>
      </div>

      {/* CTA buttons */}
      <div className="mt-5 space-y-2">
        <Button
          className="w-full rounded-md bg-neutral-950 text-white hover:bg-neutral-800 font-medium text-sm h-11 transition-colors"
          onClick={actions.handleReleaseEquipment}
        >
          Release Equipment →
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-md border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 font-medium text-sm h-9 transition-colors"
          onClick={actions.handleProcessPayment}
        >
          Process Payment
        </Button>
      </div>
    </section>
  );
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
