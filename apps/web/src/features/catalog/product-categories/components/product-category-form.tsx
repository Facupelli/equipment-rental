import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	type ProductCategoryFormValues,
	productCategoryFormSchema,
} from "../schemas/product-categories-form.schema";

interface ProductCategoryFormProps {
	defaultValues: ProductCategoryFormValues;
	onSubmit: (payload: {
		values: ProductCategoryFormValues;
		dirtyValues: Partial<ProductCategoryFormValues>;
	}) => Promise<void> | void;
	onCancel: () => void;
	isPending: boolean;
	submitLabel: string;
	pendingLabel: string;
	formId: string;
}

function getDirtyValues(
	values: ProductCategoryFormValues,
	defaultValues: ProductCategoryFormValues,
): Partial<ProductCategoryFormValues> {
	const dirtyValues: Partial<ProductCategoryFormValues> = {};

	if (values.name !== defaultValues.name) {
		dirtyValues.name = values.name;
	}

	if (values.description !== defaultValues.description) {
		dirtyValues.description = values.description;
	}

	return dirtyValues;
}

export function ProductCategoryForm({
	defaultValues,
	onSubmit,
	onCancel,
	isPending,
	submitLabel,
	pendingLabel,
	formId,
}: ProductCategoryFormProps) {
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: productCategoryFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onSubmit({
				values: value,
				dirtyValues: getDirtyValues(value, defaultValues),
			});
		},
	});

	const values = useStore(form.store, (state) => state.values);
	const hasChanges =
		values.name !== defaultValues.name ||
		values.description !== defaultValues.description;

	return (
		<>
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
					<form.Field name="name">
						{(field) => {
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
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="description">
						{(field) => {
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
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>
			</form>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							form={formId}
							disabled={!canSubmit || !hasChanges || isPending}
						>
							{isSubmitting || isPending ? pendingLabel : submitLabel}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</>
	);
}
