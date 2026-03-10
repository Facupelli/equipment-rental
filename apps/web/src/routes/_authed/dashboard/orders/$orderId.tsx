import {
  createOrderDetailQueryOptions,
  type ParsedOrderDetailResponseDto,
} from "@/features/orders/queries/get-order-by-id";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { OrderItemType, OrderStatus } from "@repo/types";
import {
  FileText,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Clock,
  Package,
  ExternalLink,
} from "lucide-react";

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_SOURCING]: "Pending Sourcing",
  [OrderStatus.SOURCED]: "Sourced",
  [OrderStatus.CONFIRMED]: "Confirmed",
  [OrderStatus.ACTIVE]: "Active",
  [OrderStatus.COMPLETED]: "Completed",
  [OrderStatus.CANCELLED]: "Cancelled",
};

export const Route = createFileRoute("/_authed/dashboard/orders/$orderId")({
  loader: ({ context: { queryClient }, params: { orderId } }) => {
    queryClient.ensureQueryData(createOrderDetailQueryOptions({ orderId }));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useParams();
  const { data: order } = useSuspenseQuery(
    createOrderDetailQueryOptions({ orderId }),
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <OrderHeader order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] px-8 py-10 gap-20">
        {/* Left */}
        <div>
          <OrderTabs order={order} />
        </div>

        {/* Right */}
        <div className="space-y-4">
          {order.customer && <OrderClientCard customer={order.customer} />}
          <OrderLogisticsCard location={order.location} period={order.period} />
          <OrderFinancialsCard financial={order.financial} />
        </div>
      </div>
    </div>
  );
}

type Props = { order: ParsedOrderDetailResponseDto };

function OrderHeader({ order }: Props) {
  return (
    <header className="px-8 pt-8 pb-6 bg-white border-b border-stone-200">
      <div className="flex items-start justify-between gap-6">
        {/* Title + meta */}
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-3xl font-bold tracking-tight leading-none">
              Order{" "}
              <span className="font-mono">
                #{order.id.slice(0, 5).toUpperCase()}
              </span>
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-stone-400 mt-2">
            Created on {order.createdAt.format("MMM DD, YYYY")} ·{" "}
            {order.createdAt.format("HH:mm A")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-sm text-stone-700 border-stone-300 hover:bg-stone-100 rounded-md h-9 px-4"
            onClick={() => {
              /* TODO */
            }}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Print PDF
          </Button>
          <Button
            size="sm"
            className="text-sm rounded-md bg-stone-950 text-white hover:bg-stone-800 h-9 px-4"
            onClick={() => {
              /* TODO */
            }}
          >
            <Pencil className="w-4 h-4 mr-1.5" />
            Edit Order
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_SOURCING]: "bg-stone-100 text-stone-600",
  [OrderStatus.SOURCED]: "bg-stone-100 text-stone-600",
  [OrderStatus.CONFIRMED]: "bg-emerald-100 text-emerald-700",
  [OrderStatus.ACTIVE]: "bg-stone-950 text-white",
  [OrderStatus.COMPLETED]: "bg-stone-200 text-stone-700",
  [OrderStatus.CANCELLED]: "bg-stone-100 text-stone-400",
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full leading-none ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function OrderTabs({ order }: Props) {
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
        <OrderItemsTable order={order} />
        <ActivityLog createdAt={order.createdAt} />
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
    <div className="border border-dashed border-stone-200 py-16 flex items-center justify-center rounded-md">
      <span className="text-sm text-stone-300">{label}</span>
    </div>
  );
}

// ─── Items Table ──────────────────────────────────────────────────────────────

function OrderItemsTable({ order }: Props) {
  const { items, financial } = order;

  // Build a map from orderItemId → financial line for O(1) lookup per row
  const financialByItemId = new Map(
    financial.items.map((line) => [line.orderItemId, line]),
  );

  return (
    <section className="mb-10">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_100px_100px] gap-4 pb-3 border-b border-stone-200">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-stone-400">
          Item Description
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-stone-400 text-center">
          Quantity
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-stone-400 text-right">
          Base Price
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-stone-400 text-right">
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

function OrderItemRow({
  item,
  financialLine,
}: {
  item: ParsedOrderDetailResponseDto["items"][number];
  financialLine:
    | ParsedOrderDetailResponseDto["financial"]["items"][number]
    | null;
}) {
  const isBundle = item.type === OrderItemType.BUNDLE;

  const serialNumber =
    !isBundle && item.assets[0]?.serialNumber
      ? item.assets[0].serialNumber
      : null;

  const bundleSummary = isBundle
    ? item.components
        .map((c) => `${c.quantity}× ${c.productTypeName}`)
        .join(" · ")
    : null;

  const qty = item.assets.length || 1;

  return (
    <div className="grid grid-cols-[1fr_80px_100px_100px] gap-4 items-center py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors rounded-sm">
      {/* Info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-14 bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 rounded-sm">
          <Package className="w-5 h-5 text-stone-300" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-stone-950 leading-snug">
            {item.name}
          </span>
          {serialNumber && (
            <span className="font-mono text-[11px] text-stone-400">
              S/N: {serialNumber}
            </span>
          )}
          {bundleSummary && (
            <span className="text-[11px] text-stone-500 font-medium">
              Bundle: {bundleSummary}
            </span>
          )}
        </div>
      </div>

      {/* Qty */}
      <div className="text-center">
        <span className="font-mono text-sm text-stone-600">{qty}</span>
      </div>

      {/* Base price */}
      <div className="text-right">
        <span className="font-mono text-sm text-stone-500">
          {financialLine ? `${financialLine.basePrice}` : "—"}
        </span>
      </div>

      {/* Final price */}
      <div className="text-right">
        <span className="font-mono text-sm font-bold text-stone-950">
          {financialLine ? `${financialLine.finalPrice}` : "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

function ActivityLog({
  createdAt,
}: {
  createdAt: ParsedOrderDetailResponseDto["createdAt"];
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-4 h-4 text-stone-400" />
        <span className="text-sm font-semibold text-stone-950">
          Activity Log
        </span>
      </div>

      <div>
        <ActivityEntry
          label="Order created"
          timestamp={createdAt.format("MMM DD, YYYY [at] HH:mm")}
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
        <div className="w-8 h-8 rounded-full bg-stone-950 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-white" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-stone-200 mt-1 min-h-6" />}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 pb-6">
        <span className="text-sm font-semibold text-stone-950">{label}</span>
        <span className="text-xs text-stone-400">
          {timestamp} · {actor}
        </span>
      </div>
    </div>
  );
}

// ─── Client Card ──────────────────────────────────────────────────────────────

function OrderClientCard({
  customer,
}: {
  customer: NonNullable<ParsedOrderDetailResponseDto["customer"]>;
}) {
  const displayName =
    customer.isCompany && customer.companyName
      ? customer.companyName
      : `${customer.firstName} ${customer.lastName}`;

  const contactName = customer.isCompany
    ? `${customer.firstName} ${customer.lastName}`
    : null;

  const initials =
    `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase();

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-stone-400">
          Customer Information
        </span>
        <Link
          to="/dashboard/customers/$customerId"
          params={{ customerId: customer.id }}
          className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-950 transition-colors"
        >
          View Profile
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-stone-600">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-stone-950 leading-tight">
            {displayName}
          </p>
          {contactName && (
            <p className="text-xs text-stone-400 mt-0.5">{contactName}</p>
          )}
        </div>
      </div>

      {/* Contact fields */}
      <div className="space-y-2.5">
        <SidebarField
          icon={<Mail className="w-3.5 h-3.5" />}
          value={customer.email}
        />
        {customer.phone && (
          <SidebarField
            icon={<Phone className="w-3.5 h-3.5" />}
            value={customer.phone}
          />
        )}
      </div>
    </section>
  );
}

// ─── Logistics Card ───────────────────────────────────────────────────────────

function OrderLogisticsCard({
  location,
  period,
}: {
  location: ParsedOrderDetailResponseDto["location"];
  period: ParsedOrderDetailResponseDto["period"];
}) {
  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5">
      <SidebarSectionLabel label="Logistics" />

      {period && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-stone-400 mb-1">
              Pickup Date
            </p>
            <p className="text-sm font-bold text-stone-950">
              {period.start.format("MMM DD, YYYY")}
            </p>
            <p className="font-mono text-[10px] text-stone-400 mt-0.5">
              {period.start.format("HH:mm")}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-stone-400 mb-1">
              Return Date
            </p>
            <p className="text-sm font-bold text-stone-950">
              {period.end.format("MMM DD, YYYY")}
            </p>
            <p className="font-mono text-[10px] text-stone-400 mt-0.5">
              {period.end.format("HH:mm")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-md px-3 py-2.5">
        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-stone-400 mb-0.5">
            Location
          </p>
          <p className="text-sm font-semibold text-stone-950">
            {location.name}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Financials Card ──────────────────────────────────────────────────────────

function OrderFinancialsCard({
  financial,
}: {
  financial: ParsedOrderDetailResponseDto["financial"];
}) {
  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5">
      <SidebarSectionLabel label="Financial Summary" />

      <div>
        {financial.items.map((line, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 border-b border-stone-100"
          >
            <span className="text-sm text-stone-500">{line.label}</span>
            <span className="font-mono text-sm text-stone-950">
              {line.finalPrice}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-baseline justify-between pt-4 mt-1">
        <span className="text-sm font-bold text-stone-950">Total Amount</span>
        <span className="font-mono text-xl font-bold text-stone-950 tracking-tight">
          {financial.total}
        </span>
      </div>

      {/* CTA buttons */}
      <div className="mt-5 space-y-2">
        <Button
          className="w-full rounded-md bg-stone-950 text-white hover:bg-stone-800 font-medium text-sm h-11 transition-colors"
          onClick={() => {
            /* TODO: release equipment */
          }}
        >
          Release Equipment →
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-md border-stone-200 hover:border-stone-400 hover:bg-stone-50 font-medium text-sm h-9 transition-colors"
          onClick={() => {
            /* TODO: process payment */
          }}
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
    <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-stone-400 mb-4 pb-3 border-b border-stone-100">
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
      <span className="text-stone-400 shrink-0">{icon}</span>
      <span className="text-xs text-stone-500">{value}</span>
    </div>
  );
}
