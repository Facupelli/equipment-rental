import { useBillingUnits } from "@/features/billing-unit/billing-unit.queries";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Clock, Sun, CalendarDays, Grid2x2, CalendarClock } from "lucide-react";
import type { BillingUnitListResponse } from "@repo/schemas";
import { useSyncTenantBillingUnits } from "@/features/tenant/billing-unit/tenant-billing.queries";
import { TenantConfigForm } from "@/features/tenant/components/tenant-config-form";

export const Route = createFileRoute("/_admin/dashboard/settings/")({
  component: RouteComponent,
});

const authedRoute = getRouteApi("/_admin/dashboard");

function RouteComponent() {
  const { data: billingUnits = [], isPending, isError } = useBillingUnits();

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your tenant settings.
          </p>
        </div>
      </div>

      <div>
        <section>
          {isPending && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {!isPending && !isError && (
            <ActiveBillingUnitsForm billingUnits={billingUnits} />
          )}
        </section>

        <TenantConfigForm />
      </div>
    </div>
  );
}

const ICON_MAP: Record<string, React.ElementType> = {
  hourly: Clock,
  "half-day": Sun,
  daily: CalendarDays,
  weekly: Grid2x2,
  monthly: CalendarClock,
};

function resolveIcon(label: string): React.ElementType {
  const key = label.toLowerCase();
  const match = Object.keys(ICON_MAP).find((k) => key.includes(k));
  return match ? ICON_MAP[match] : Clock;
}

const formatDuration = (minutes: number): string => {
  const units = [
    { limit: 60, divisor: 1, suffix: "m" },
    { limit: 1440, divisor: 60, suffix: "h" },
    { limit: 10080, divisor: 1440, suffix: "d" },
    { limit: Infinity, divisor: 10080, suffix: "w" },
  ];

  const unit = units.find((u) => minutes < u.limit)!;
  return `${Math.floor(minutes / unit.divisor)}${unit.suffix}`;
};

interface ActiveBillingUnitsFormProps {
  billingUnits: BillingUnitListResponse;
}

export function ActiveBillingUnitsForm({
  billingUnits,
}: ActiveBillingUnitsFormProps) {
  const { tenant } = authedRoute.useLoaderData();

  const { mutate: syncBillingUnits } = useSyncTenantBillingUnits({
    onSuccess: () => {
      console.log("sucess");
    },
    onError: (error) => {
      console.log({ error });
    },
  });

  const form = useForm({
    defaultValues: {
      billingUnitIds: tenant.billingUnits.map((unit) => unit.billingUnitId),
    },
    onSubmit: ({ value }) => {
      syncBillingUnits(value);
    },
  });

  return (
    <section className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Active Billing Units</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select the time increments available for your rental assets across all
          locations.
        </p>
      </div>

      {/* Grid */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field
          name="billingUnitIds"
          validators={{
            onSubmit: ({ value }) =>
              value.length === 0
                ? "Select at least one billing unit."
                : undefined,
          }}
        >
          {(field) => {
            const enabled = new Set(field.state.value);

            function toggle(id: string) {
              const next = new Set(enabled);
              if (next.has(id)) {
                next.delete(id);
              } else {
                next.add(id);
              }
              field.handleChange(Array.from(next));
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {billingUnits
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((unit) => {
                    const Icon = resolveIcon(unit.label);
                    const isEnabled = enabled.has(unit.id);

                    return (
                      <div
                        key={unit.id}
                        className="flex items-center gap-4 rounded-xl bg-card border border-border px-5 py-4 transition-colors hover:bg-card/80"
                      >
                        {/* Icon */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-none">
                            {unit.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDuration(unit.durationMinutes)}
                          </p>
                        </div>

                        {/* Toggle */}
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggle(unit.id)}
                          aria-label={`Toggle ${unit.label}`}
                        />
                      </div>
                    );
                  })}
              </div>
            );
          }}
        </form.Field>

        <div className="flex justify-end">
          <Button type="submit">Save Billing Units</Button>
        </div>
      </form>
    </section>
  );
}
