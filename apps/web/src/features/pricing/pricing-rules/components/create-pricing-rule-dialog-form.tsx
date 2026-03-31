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
import { Clock, Minus, Plus, Trash2 } from "lucide-react";
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
  [PricingRuleType.DURATION]: "Por Duración",
};

const TYPE_DESCRIPTIONS: Record<PricingRuleType, string> = {
  [PricingRuleType.SEASONAL]:
    "Descuento activo durante un rango de fechas. Se aplica cuando el alquiler comienza dentro del período.",
  [PricingRuleType.VOLUME]:
    "Descuento por cantidad de productos de una misma categoría en el pedido.",
  [PricingRuleType.COUPON]:
    "Descuento que se activa con un código promocional ingresado por el cliente.",
  [PricingRuleType.CUSTOMER_SPECIFIC]:
    "Descuento exclusivo para un cliente en particular.",
  [PricingRuleType.DURATION]:
    "Descuento que aumenta según los días de alquiler. Aplica a todos los productos.",
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

      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-svh">
        <DialogHeader>
          <DialogTitle>Nueva Regla de Precio</DialogTitle>
          <DialogDescription>
            Crea una regla de descuento. Las reglas se evalúan automáticamente
            al calcular el precio de cada alquiler.
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
          {/* Type */}
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
                        <SelectItem
                          key={t}
                          value={t}
                          disabled={t === PricingRuleType.VOLUME}
                        >
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {TYPE_DESCRIPTIONS[field.state.value]}
                  </p>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Scope + Priority */}
          <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Para reglas de duración, usa "Todo el pedido".
                    </p>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

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
                    <p className="text-xs text-muted-foreground mt-1">
                      Menor número = mayor prioridad.
                    </p>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>

          {/* Stackable */}
          <form.Field
            name="stackable"
            children={(field) => (
              <Field>
                <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
                  <div>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-sm font-medium"
                    >
                      ¿Acumulable con otras reglas?
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Si está activado, este descuento se suma a otros
                      aplicables.
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

          {/* Dynamic condition section */}
          <form.Subscribe
            selector={(state) => state.values.type}
            children={(type) => <ConditionSection type={type} form={form} />}
          />

          {/* Effect + Value — hidden for DURATION since discount is defined in tiers */}
          <form.Subscribe
            selector={(state) => state.values.type}
            children={(type) =>
              type !== PricingRuleType.DURATION && (
                <div className="grid grid-cols-2 gap-4">
                  <form.Field
                    name="effect.type"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel>Tipo de Descuento</FieldLabel>
                          <Select
                            value={field.state.value}
                            onValueChange={(value) =>
                              field.handleChange(value as PricingRuleEffectType)
                            }
                            items={Object.values(PricingRuleEffectType).map(
                              (e) => ({
                                value: e,
                                label: EFFECT_LABELS[e],
                              }),
                            )}
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
                          <p className="text-xs text-muted-foreground mt-1">
                            Porcentaje: 0-100. Monto fijo: cantidad a descontar.
                          </p>
                        </Field>
                      );
                    }}
                  />
                </div>
              )
            }
          />

          {/* Name */}
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Nombre de referencia
                    </FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="Ej: descuento-verano-2025"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nombre interno. No es visible para los clientes.
                    </p>
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
  const titles: Record<PricingRuleType, string> = {
    [PricingRuleType.SEASONAL]: "Período de Vigencia",
    [PricingRuleType.VOLUME]: "Condición de Cantidad",
    [PricingRuleType.COUPON]: "Código Promocional",
    [PricingRuleType.CUSTOMER_SPECIFIC]: "Cliente Objetivo",
    [PricingRuleType.DURATION]: "Tramos de Duración",
  };

  const descriptions: Record<PricingRuleType, string> = {
    [PricingRuleType.SEASONAL]:
      "Rango de fechas en el que esta regla está activa.",
    [PricingRuleType.VOLUME]:
      "Categoría y cantidad mínima de items para activar el descuento.",
    [PricingRuleType.COUPON]:
      "Código que el cliente debe ingresar para activar el descuento.",
    [PricingRuleType.CUSTOMER_SPECIFIC]:
      "Identificador del cliente que recibe este descuento.",
    [PricingRuleType.DURATION]:
      "Tramos de duración y descuento para cada uno. El último tramo debe tener 'Hasta' vacío.",
  };

  return (
    <div className="rounded-lg bg-muted/50 border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{titles[type]}</span>
      </div>
      <p className="text-xs text-muted-foreground">{descriptions[type]}</p>

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
                  <FieldLabel htmlFor={field.name}>Categoría</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="UUID de la categoría"
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
                  <FieldLabel htmlFor={field.name}>
                    Cantidad mínima de items
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    min={1}
                    placeholder="5"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
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
                <FieldLabel htmlFor={field.name}>Código del cupón</FieldLabel>
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
                <FieldLabel htmlFor={field.name}>
                  Identificador del cliente
                </FieldLabel>
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

      {type === PricingRuleType.DURATION && (
        <form.Field
          name="condition.tiers"
          mode="array"
          children={(field: any) => {
            const tiers = field.state.value || [];

            function handleAddTier() {
              const lastTier = tiers[tiers.length - 1];
              const nextFrom = lastTier
                ? lastTier.toDays !== null
                  ? lastTier.toDays + 1
                  : lastTier.fromDays + 1
                : 1;
              field.pushValue({
                fromDays: nextFrom,
                toDays: null,
                discountPct: 0,
              });
            }

            return (
              <div className="space-y-3">
                <form.Subscribe
                  selector={(state: any) => state.errorMap.onSubmit}
                  children={(onSubmitError: any) => {
                    console.log("onSubmitError received:", onSubmitError);

                    // Handle case where onSubmitError is a ZodError
                    if (
                      !onSubmitError ||
                      !Array.isArray(onSubmitError.issues)
                    ) {
                      return null;
                    }

                    // Filter issues related to condition.tiers
                    const tierIssues = onSubmitError.issues.filter(
                      (issue: any) =>
                        Array.isArray(issue.path) &&
                        issue.path.length >= 4 &&
                        issue.path[0] === "condition" &&
                        issue.path[1] === "tiers",
                    );

                    if (tierIssues.length === 0) return null;

                    const messages: string[] = [];
                    tierIssues.forEach((issue: any) => {
                      const tierIndex = issue.path[2];
                      const fieldName = issue.path[3];
                      let fieldLabel = fieldName;

                      // Map field names to labels
                      switch (fieldName) {
                        case "fromDays":
                          fieldLabel = "Desde (días)";
                          break;
                        case "toDays":
                          fieldLabel = "Hasta (días)";
                          break;
                        case "discountPct":
                          fieldLabel = "Descuento (%)";
                          break;
                      }

                      messages.push(
                        `Tramo ${tierIndex + 1} - ${fieldLabel}: ${issue.message}`,
                      );
                    });

                    return (
                      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-1">
                        {messages.map((msg, i) => (
                          <p key={i}>{msg}</p>
                        ))}
                      </div>
                    );
                  }}
                />

                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div className="col-span-3">Desde (días)</div>
                  <div className="col-span-3">Hasta (días)</div>
                  <div className="col-span-3">Descuento (%)</div>
                  <div className="col-span-3" />
                </div>

                {tiers.map((_: unknown, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-start"
                  >
                    <div className="col-span-3">
                      <form.Field
                        name={`condition.tiers[${index}].fromDays`}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        children={(subField: any) => {
                          const isInvalid =
                            subField.state.meta.isTouched &&
                            !subField.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <Input
                                type="number"
                                min={1}
                                value={subField.state.value}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(Number(e.target.value))
                                }
                                aria-invalid={isInvalid}
                                placeholder="1"
                              />
                              {isInvalid && (
                                <FieldError
                                  errors={subField.state.meta.errors}
                                />
                              )}
                            </Field>
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <form.Field
                        name={`condition.tiers[${index}].toDays`}
                        children={(subField: any) => {
                          const isInvalid =
                            subField.state.meta.isTouched &&
                            !subField.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <Input
                                type="number"
                                min={1}
                                value={subField.state.value ?? ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  )
                                }
                                aria-invalid={isInvalid}
                                placeholder="∞"
                              />
                              {isInvalid && (
                                <FieldError
                                  errors={subField.state.meta.errors}
                                />
                              )}
                            </Field>
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <form.Field
                        name={`condition.tiers[${index}].discountPct`}
                        children={(subField: any) => {
                          const isInvalid =
                            subField.state.meta.isTouched &&
                            !subField.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={subField.state.value}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(Number(e.target.value))
                                }
                                aria-invalid={isInvalid}
                                placeholder="0"
                              />
                              {isInvalid && (
                                <FieldError
                                  errors={subField.state.meta.errors}
                                />
                              )}
                            </Field>
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                      {tiers.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => field.removeValue(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTier}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Agregar tramo
                </Button>

                <p className="text-xs text-muted-foreground">
                  Cada tramo define un rango de días y el descuento que se
                  aplica. Deja "Hasta" vacío en el último tramo para cubrir
                  alquileres de cualquier duración mayor.
                </p>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
