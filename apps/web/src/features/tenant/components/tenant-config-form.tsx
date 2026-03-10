import { useForm } from "@tanstack/react-form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RoundingRule } from "@repo/types";
import { getRouteApi } from "@tanstack/react-router";
import { useUpdateConfig } from "@/features/tenant/tenant.queries";
import {
  tenantConfigFormSchema,
  tenantConfigToFormValues,
  toUpdateTenantConfigDto,
} from "../schemas/tenant-config-form.schema";

const authedRoute = getRouteApi("/_authed");

export function TenantConfigForm() {
  const { tenant } = authedRoute.useLoaderData();

  const { mutateAsync: updateConfig } = useUpdateConfig();

  const form = useForm({
    defaultValues: tenantConfigToFormValues(tenant.config),
    validators: {
      onSubmit: tenantConfigFormSchema,
    },
    onSubmit: async ({ value }) => {
      const dto = toUpdateTenantConfigDto(value);
      try {
        await updateConfig(dto);
      } catch (error) {
        console.log({ error });
      }
    },
  });

  return (
    <section className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white">General Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage pricing rules, timezone, and catalog behavior for your tenant.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        {/* Pricing */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pricing
          </h3>

          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {/* Over-rental */}
            <form.Field name="overRentalEnabled">
              {(field) => (
                <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Over-rental
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Allow orders when no owned asset is available.
                    </p>
                  </div>
                  <div className="pt-1">
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                      aria-label="Toggle over-rental"
                    />
                  </div>
                </div>
              )}
            </form.Field>

            {/* Max over-rent threshold */}
            <form.Field name="maxOverRentThreshold">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Max over-rent threshold
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Maximum number of units that can be over-rented at once.
                      </p>
                    </div>
                    <Field data-invalid={isInvalid} className="items-end pt-1">
                      <Input
                        id={field.name}
                        type="number"
                        min={0}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                        className="w-24 text-right"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  </div>
                );
              }}
            </form.Field>

            {/* Weekend counts as one */}
            <form.Field name="weekendCountsAsOne">
              {(field) => (
                <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Weekend counts as one day
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Saturday and Sunday are billed as a single billing unit.
                    </p>
                  </div>
                  <div className="pt-1">
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                      aria-label="Toggle weekend billing"
                    />
                  </div>
                </div>
              )}
            </form.Field>

            {/* Rounding rule */}
            <form.Field name="roundingRule">
              {(field) => (
                <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Rounding rule
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      How partial billing units are rounded.
                    </p>
                  </div>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as RoundingRule)}
                    // pt-1 applied via trigger below for optical alignment
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RoundingRule.ROUND_UP}>
                        Round up
                      </SelectItem>
                      <SelectItem value={RoundingRule.SPLIT}>Split</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            {/* Default currency */}
            <form.Field name="defaultCurrency">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Default currency
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ISO 4217 code (e.g. USD, ARS, EUR).
                      </p>
                    </div>
                    <Field data-invalid={isInvalid} className="items-end pt-1">
                      <FieldLabel htmlFor={field.name} className="sr-only">
                        Default currency
                      </FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.target.value.toUpperCase())
                        }
                        onBlur={field.handleBlur}
                        maxLength={3}
                        className="w-24 text-right uppercase"
                        placeholder="ARS"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  </div>
                );
              }}
            </form.Field>
          </div>
        </div>

        {/* General */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            General
          </h3>

          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {/* Timezone */}
            <form.Field name="timezone">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Timezone
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        IANA timezone identifier (e.g. America/Argentina/Jujuy).
                      </p>
                    </div>
                    <Field data-invalid={isInvalid} className="items-end pt-1">
                      <FieldLabel htmlFor={field.name} className="sr-only">
                        Timezone
                      </FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="w-56 text-right"
                        placeholder="UTC"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  </div>
                );
              }}
            </form.Field>

            {/* New arrivals window */}
            <form.Field name="newArrivalsWindowDays">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        New arrivals window
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Days a product is shown as "new" after being added.
                      </p>
                    </div>
                    <Field data-invalid={isInvalid} className="items-end pt-1">
                      <div className="flex items-center gap-2">
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          step={1}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          onBlur={field.handleBlur}
                          className="w-24 text-right"
                        />
                        <span className="text-sm text-muted-foreground">
                          days
                        </span>
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  </div>
                );
              }}
            </form.Field>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Save Configuration</Button>
        </div>
      </form>
    </section>
  );
}
