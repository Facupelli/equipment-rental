import { BookingMode, RoundingRule } from "@repo/types";
import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  tenantConfigFormSchema,
  tenantConfigToFormValues,
  toUpdateTenantConfigDto,
} from "../schemas/tenant-config-form.schema";
import { tenantQueries, useUpdateTenantConfig } from "../tenant.queries";

type TenantConfigSection = "pricing" | "general";

interface TenantConfigFormProps {
  section: TenantConfigSection;
}

export function TenantConfigForm({ section }: TenantConfigFormProps) {
  const form = useTenantConfigSettingsForm();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {section === "pricing" ? (
        <PricingSettingsFields form={form} />
      ) : (
        <GeneralSettingsFields form={form} />
      )}

      <div className="flex justify-end">
        <Button type="submit">Guardar Configuración</Button>
      </div>
    </form>
  );
}

function useTenantConfigSettingsForm() {
  const { data: tenant } = useSuspenseQuery(tenantQueries.me());
  const { mutateAsync: updateConfig } = useUpdateTenantConfig();

  return useForm({
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
}

type TenantConfigSettingsFormApi = ReturnType<
  typeof useTenantConfigSettingsForm
>;

function PricingSettingsFields({
  form,
}: {
  form: TenantConfigSettingsFormApi;
}) {
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      <form.Field name="weekendCountsAsOne">
        {(field) => (
          <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Sistema day/weekend
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sabado y Domingo son contados como una sola unidad de
                facturación.
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
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RoundingRule.ROUND_UP}>Round up</SelectItem>
                <SelectItem value={RoundingRule.SPLIT}>Split</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="currency">
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            </div>
          );
        }}
      </form.Field>

      <form.Field name="locale">
        {(field) => (
          <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Locale</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Como se muestra el precio en la aplicación.
              </p>
            </div>
            <Select
              value={field.state.value}
              onValueChange={(value) => value && field.handleChange(value)}
              items={[
                { value: "es-AR", label: "Español (AR)" },
                { value: "es-ES", label: "Español (ES)" },
                { value: "en-US", label: "Inglés (US)" },
              ]}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es-AR">Español (AR)</SelectItem>
                <SelectItem value="es-ES">Español (ES)</SelectItem>
                <SelectItem value="en-US">Inglés (US)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>
    </div>
  );
}

function GeneralSettingsFields({
  form,
}: {
  form: TenantConfigSettingsFormApi;
}) {
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      <form.Field name="bookingMode">
        {(field) => (
          <div className="grid grid-cols-[1fr_auto] items-start gap-8 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Booking mode
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose whether customer bookings confirm immediately or wait for
                operator review.
              </p>
            </div>
            <Select
              value={field.state.value}
              onValueChange={(value) => value && field.handleChange(value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BookingMode.INSTANT_BOOK}>
                  Instant book
                </SelectItem>
                <SelectItem value={BookingMode.REQUEST_TO_BOOK} disabled>
                  Request to book
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            </div>
          );
        }}
      </form.Field>

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
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    onBlur={field.handleBlur}
                    className="w-24 text-right"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}
