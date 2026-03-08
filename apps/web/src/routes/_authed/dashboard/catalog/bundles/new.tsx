import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";
import type { ProductTypeResponse } from "@repo/schemas";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  bundleFormDefaults,
  bundleFormSchema,
  toCreateBundleDto,
} from "@/features/catalog/bundles/schemas/bundle-form.schema";
import useDebounce from "@/shared/hooks/use-debounce";
import { useProducts } from "@/features/catalog/product-types/products.queries";
import { Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useCreateBundle } from "@/features/catalog/bundles/bundles.queries";

export const Route = createFileRoute("/_authed/dashboard/catalog/bundles/new")({
  component: NewBundlePage,
});

const authedRoute = getRouteApi("/_authed");

function NewBundlePage() {
  const navigate = useNavigate();
  const {
    tenant: { billingUnits },
  } = authedRoute.useLoaderData();

  const { mutateAsync: createBundle } = useCreateBundle();

  const form = useForm({
    defaultValues: bundleFormDefaults,
    validators: {
      onSubmit: bundleFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const dto = toCreateBundleDto(value);
        await createBundle(dto);
        navigate({ to: "/dashboard/catalog/bundles" });
      } catch (error) {
        console.log({ error });
      }
    },
  });

  function handleCancel() {
    navigate({ to: "/dashboard/catalog/bundles" });
  }

  const addedIds = useStore(form.store, (s) =>
    useMemo(
      () => new Set(s.values.components.map((c) => c.productTypeId)),
      [s.values.components],
    ),
  );

  const isSaveDisabled = useStore(form.store, (s) => {
    const { name, billingUnitId, components } = s.values;
    return !name.trim() || !billingUnitId || components.length === 0;
  });

  function handleAddProduct(product: ProductTypeResponse) {
    const price = product.pricingTiers[0]?.pricePerUnit;
    const subtitle = [product.category?.name, price != null ? price : null]
      .filter(Boolean)
      .join(" · ");

    form.setFieldValue("components", (prev) => [
      ...prev,
      {
        productTypeId: product.id,
        quantity: 1,
        name: product.name,
        subtitle,
        assetCount: product.assetCount,
      },
    ]);
  }

  return (
    <div className="w-3xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex min-h-screen flex-col"
      >
        {/* ------------------------------------------------------------------ */}
        {/* Page header                                                         */}
        {/* ------------------------------------------------------------------ */}
        <div className="border-border border-b px-6 py-5">
          <h1 className="text-xl font-semibold tracking-tight">
            Create Product Bundle
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Group products together and assign a shared billing unit.
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Body                                                                */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Row 1 — Name + Billing unit */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bundle name */}
            <form.Field name="name">
              {(field) => (
                <div className="space-y-1.5">
                  <Label
                    htmlFor={field.name}
                    className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                  >
                    Bundle Name
                  </Label>
                  <Input
                    id={field.name}
                    placeholder="e.g. Premium Cotton Collection"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors[0].message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Billing unit */}
            <form.Field name="billingUnitId">
              {(field) => (
                <div className="space-y-1.5">
                  <Label
                    htmlFor={field.name}
                    className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                  >
                    Billing Unit
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (value !== null) field.handleChange(value);
                    }}
                    items={billingUnits.map((unit) => ({
                      value: unit.id,
                      label: unit.label,
                    }))}
                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={field.state.meta.errors.length > 0}
                    >
                      <SelectValue placeholder="Select billing unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {billingUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors[0] && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors[0].message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Row 2 — Bundle status */}
          <form.Field name="isActive">
            {(field) => (
              <div className="bg-muted/40 border-border flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Bundle Status</p>
                  <p className="text-muted-foreground text-xs">
                    Enable this bundle for storefront display
                  </p>
                </div>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                  aria-label="Bundle status"
                />
              </div>
            )}
          </form.Field>

          {/* Row 3 — Components */}
          <form.Field name="components" mode="array">
            {(field) => {
              const components = field.state.value;

              return (
                <div className="space-y-3">
                  {/* Section header */}
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      Bundle Components
                    </Label>
                    {components.length > 0 && (
                      <Badge variant="secondary">
                        {components.length}{" "}
                        {components.length === 1 ? "item" : "items"}
                      </Badge>
                    )}
                  </div>

                  {/* Product search */}
                  <BundleProductSearch
                    addedIds={addedIds}
                    onAdd={handleAddProduct}
                  />

                  {/* Added components list */}
                  {components.length > 0 && (
                    <div className="border-border divide-border divide-y rounded-lg border">
                      {components.map((component, index) => (
                        <form.Field
                          key={component.productTypeId}
                          name={`components[${index}].quantity`}
                        >
                          {(quantityField) => (
                            <BundleComponentRow
                              name={component.name}
                              subtitle={component.subtitle}
                              quantity={quantityField.state.value}
                              maxQuantity={component.assetCount}
                              onIncrement={() =>
                                quantityField.handleChange(
                                  quantityField.state.value + 1,
                                )
                              }
                              onDecrement={() =>
                                quantityField.handleChange(
                                  Math.max(1, quantityField.state.value - 1),
                                )
                              }
                              onRemove={() => field.removeValue(index)}
                            />
                          )}
                        </form.Field>
                      ))}
                    </div>
                  )}

                  {/* Validation error for the array itself */}
                  {field.state.meta.errors[0] && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors[0].message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Footer                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSaveDisabled || isSubmitting}>
                {isSubmitting ? "Saving…" : "Save Bundle"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}

interface BundleProductSearchProps {
  /** Set of productTypeIds already in the bundle */
  addedIds: Set<string>;
  onAdd: (product: ProductTypeResponse) => void;
}

function BundleProductSearch({ addedIds, onAdd }: BundleProductSearchProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: products, isFetching } = useProducts({
    search: debouncedSearch || undefined,
    isActive: true,
  });

  const results = products?.data ?? [];

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        {isFetching && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
        )}
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="border-border divide-border divide-y rounded-lg border">
          {results.map((product) => {
            const isAdded = addedIds.has(product.id);
            // First pricing tier = smallest unit (ordered desc from API)
            const price = product.pricingTiers[0]?.pricePerUnit;

            return (
              <div
                key={product.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                {/* Product image placeholder */}
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                  <span className="text-muted-foreground text-xs font-medium uppercase">
                    {product.name.slice(0, 2)}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {product.category?.name && (
                      <span>{product.category.name} · </span>
                    )}
                    {price != null ? price : "No price"}
                  </p>
                </div>

                {/* Action */}
                <button
                  type="button"
                  onClick={() => !isAdded && onAdd(product)}
                  disabled={isAdded}
                  className={
                    isAdded
                      ? "text-muted-foreground cursor-default text-xs"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                  }
                >
                  {isAdded ? (
                    "Added"
                  ) : (
                    <>
                      <Plus className="size-3" />
                      Add
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state — only shown after a deliberate search */}
      {debouncedSearch && results.length === 0 && !isFetching && (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No products found for &quot;{debouncedSearch}&quot;
        </p>
      )}
    </div>
  );
}

interface BundleComponentRowProps {
  name: string;
  subtitle: string;
  quantity: number;
  maxQuantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

function BundleComponentRow({
  name,
  subtitle,
  quantity,
  maxQuantity,
  onIncrement,
  onDecrement,
  onRemove,
}: BundleComponentRowProps) {
  const atMax = quantity >= maxQuantity;
  const atMin = quantity <= 1;

  console.log({ quantity, maxQuantity, atMax, atMin });

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      {/* Placeholder thumbnail */}
      <div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
        <span className="text-muted-foreground text-xs font-medium uppercase">
          {name.slice(0, 2)}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={onDecrement}
          disabled={atMin}
          aria-label="Decrease quantity"
        >
          <Minus className="size-3" />
        </Button>

        <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={onIncrement}
          aria-label="Increase quantity"
          disabled={atMax}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <span className="text-muted-foreground w-16 text-right text-xs">
        {maxQuantity} of {maxQuantity}
      </span>

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive size-7"
        onClick={onRemove}
        aria-label="Remove component"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
