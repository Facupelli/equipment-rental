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

export const Route = createFileRoute("/_authed/dashboard/inventory/categories/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(createCategoryQueryOptions()),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories } = useCategories();

  return (
    <div>
      <p>Hello "/_authed/dashboard/categories/"!</p>
      <div>
        <CreateCategoryDialog />
      </div>
      <div className="text-black">
        {categories?.map((category) => (
          <div key={category.id} className="flex gap-10 items-center">
            <p>{category.name}</p>
            <p>{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const formId = "create-category";

export function CreateCategoryDialog() {
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
            <Plus className="h-4 w-4 mr-2" />
            Create Category
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
