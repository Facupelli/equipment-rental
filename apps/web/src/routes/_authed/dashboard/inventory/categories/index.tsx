import {
  createCategoryQueryOptions,
  useCategories,
  useCreateCategory,
} from "@/features/inventory/categories/categories.queries";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCategorySchema } from "@repo/schemas";
import { useForm } from "@tanstack/react-form";
import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_authed/dashboard/inventory/categories/",
)({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(createCategoryQueryOptions()),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage categories for organizing your products.
          </p>
        </div>

        <CreateCategoryDialog />
      </div>

      <CategoriesTable />
    </div>
  );
}

function CategoriesTable() {
  const { data: categories = [], isPending, isError } = useCategories();

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load categories. Please try again.
      </p>
    );
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No categories found.</p>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[1fr_2fr_auto] items-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
        <span>Category Name</span>
        <span>Description</span>
        <span>Actions</span>
      </div>

      {categories.map((category, index) => (
        <div
          key={category.id}
          className={cn(
            "grid grid-cols-[1fr_2fr_auto] items-start gap-4 px-4 py-5",
            index !== categories.length - 1 && "border-b",
          )}
        >
          <p className="font-medium">{category.name}</p>
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>
          <div className="w-16" /> {/* actions placeholder */}
        </div>
      ))}
    </div>
  );
}

const formId = "create-category";

function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createCategory, isPending } = useCreateCategory();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onChange: createCategorySchema,
    },
    onSubmit: async ({ value }) => {
      createCategory(value, {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Add a new category to organize your inventory.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
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

            <form.Field
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Description{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
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
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form={formId}
                  disabled={!canSubmit || isPending}
                >
                  {isSubmitting || isPending ? "Creating..." : "Create"}
                </Button>
              </>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
