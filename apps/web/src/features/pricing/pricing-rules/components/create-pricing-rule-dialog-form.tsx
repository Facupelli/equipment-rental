import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { CalendarDays, Plus } from "lucide-react";
import {
  PricingRuleEffectType,
  PricingRuleScope,
  PricingRuleType,
} from "@repo/types";
import { useCreatePricingRule } from "../pricing-rules.queries";
import {
  defaultConditionFor,
  pricingRuleFormDefaults,
  pricingRuleFormSchema,
  toCreatePricingRuleDto,
} from "../schemas/create-pricing-rule-form.schema";
import { useState } from "react";

const TYPE_LABELS: Record<PricingRuleType, string> = {
  [PricingRuleType.SEASONAL]: "Estacional",
  [PricingRuleType.VOLUME]: "Volumen",
  [PricingRuleType.COUPON]: "Cupón",
  [PricingRuleType.CUSTOMER_SPECIFIC]: "Cliente Específico",
};

const SCOPE_LABELS: Record<PricingRuleScope, string> = {
  [PricingRuleScope.ORDER]: "Todo el pedido",
  [PricingRuleScope.PRODUCT_TYPE]: "Tipo de Producto",
  [PricingRuleScope.CATEGORY]: "Categoría",
  [PricingRuleScope.BUNDLE]: "Bundle",
};

const EFFECT_LABELS: Record<PricingRuleEffectType, string> = {
  [PricingRuleEffectType.PERCENTAGE]: "Porcentaje (%)",
  [PricingRuleEffectType.FLAT]: "Monto Fijo ($)",
};

const formId = "create-pricing-rule";

export function CreatePricingRuleDialogForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { mutateAsync: createPricingRule, isPending } = useCreatePricingRule();

  const form = useForm({
    defaultValues: pricingRuleFormDefaults,
    validators: {
      onSubmit: pricingRuleFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const dto = toCreatePricingRuleDto(value);
        await createPricingRule(dto);
        setIsDialogOpen(false);
      } catch (error) {
        console.error({ error });
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
            Nueva Regla
          </Button>
        }
      />

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Regla de Precio</DialogTitle>
          <DialogDescription>
            Define las condiciones y efectos de la promoción.
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
          {/* Type + Scope */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="type"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Tipo de Regla</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        const next = value as PricingRuleType;
                        field.handleChange(next);
                        // Reset condition to match the new type
                        form.setFieldValue(
                          "condition",
                          defaultConditionFor(next),
                        );
                      }}
                      items={Object.values(PricingRuleType).map((t) => ({
                        value: t,
                        label: TYPE_LABELS[t],
                      }))}
                    >
                      <SelectTrigger aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PricingRuleType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_LABELS[t]}
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
            />

            <form.Field
              name="scope"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Alcance</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as PricingRuleScope)
                      }
                      items={Object.values(PricingRuleScope).map((s) => ({
                        value: s,
                        label: SCOPE_LABELS[s],
                      }))}
                    >
                      <SelectTrigger aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PricingRuleScope).map((s) => (
                          <SelectItem key={s} value={s}>
                            {SCOPE_LABELS[s]}
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
            />
          </div>

          {/* Priority + Stackable */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="priority"
              children={(field) => {
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="stackable"
              children={(field) => (
                <Field>
                  <div className="rounded-lg border px-4 py-3 flex items-center justify-between h-full">
                    <div>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-sm font-medium"
                      >
                        ¿Acumulable?
                      </FieldLabel>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Permitir con otros descuentos
                      </p>
                    </div>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                </Field>
              )}
            />
          </div>

          {/* Dynamic condition section */}
          <form.Subscribe
            selector={(state) => state.values.type}
            children={(type) => <ConditionSection type={type} form={form} />}
          />

          {/* Effect + Value */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="effect.type"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Efecto</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as PricingRuleEffectType)
                      }
                      items={Object.values(PricingRuleEffectType).map((e) => ({
                        value: e,
                        label: EFFECT_LABELS[e],
                      }))}
                    >
                      <SelectTrigger aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PricingRuleEffectType).map((e) => (
                          <SelectItem key={e} value={e}>
                            {EFFECT_LABELS[e]}
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
            />

            <form.Field
              name="effect.value"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Valor</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
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
            />
          </div>

          {/* Name — internal reference label */}
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Nombre interno</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="Ej: black-friday-tier-2"
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
                  {isSubmitting || isPending ? "Creando..." : "Crear Regla"}
                </Button>
              </>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ConditionSectionProps {
  type: PricingRuleType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

function ConditionSection({ type, form }: ConditionSectionProps) {
  const icon = <CalendarDays className="h-4 w-4 text-muted-foreground" />;

  const titles: Record<PricingRuleType, string> = {
    [PricingRuleType.SEASONAL]: "Condición Temporal (Estacional)",
    [PricingRuleType.VOLUME]: "Condición de Volumen",
    [PricingRuleType.COUPON]: "Condición de Cupón",
    [PricingRuleType.CUSTOMER_SPECIFIC]: "Condición de Cliente",
  };

  return (
    <div className="rounded-lg bg-muted/50 border p-4 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{titles[type]}</span>
      </div>

      {type === PricingRuleType.SEASONAL && (
        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="condition.dateFrom"
            children={(field: any) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Fecha Inicio</FieldLabel>
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
          />
          <form.Field
            name="condition.dateTo"
            children={(field: any) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Fecha Fin</FieldLabel>
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
          />
        </div>
      )}

      {type === PricingRuleType.VOLUME && (
        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="condition.categoryId"
            children={(field: any) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>ID de Categoría</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="UUID de categoría"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="condition.threshold"
            children={(field: any) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Umbral (días)</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    min={1}
                    placeholder="7"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
      )}

      {type === PricingRuleType.COUPON && (
        <form.Field
          name="condition.code"
          children={(field: any) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Código</FieldLabel>
                <Input
                  id={field.name}
                  placeholder="Ej: BLACKFRIDAY24"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value.toUpperCase())
                  }
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      )}

      {type === PricingRuleType.CUSTOMER_SPECIFIC && (
        <form.Field
          name="condition.customerId"
          children={(field: any) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>ID de Cliente</FieldLabel>
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
        />
      )}
    </div>
  );
}
