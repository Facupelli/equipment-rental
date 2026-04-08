import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { withForm } from "@/shared/contexts/form.context";
import { customerFormValues } from "../../schemas/onboard-form.schema";

export const Step4Contacts = withForm({
	defaultValues: customerFormValues,
	render: ({ form }) => (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold tracking-tight">
					Contactos de referencia
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Necesitamos al menos un contacto de referencia.
				</p>
			</div>

			<div className="space-y-4">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Contacto 1
				</p>
				<FieldGroup>
					<form.Field name="contact1Name">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Nombre completo</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="María García"
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

					<form.Field name="contact1Relationship">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Vínculo</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Cónyuge, hermano/a, amigo/a..."
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
			</div>

			<div className="space-y-4">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Contacto 2{" "}
					<span className="normal-case font-normal text-muted-foreground/70">
						(opcional)
					</span>
				</p>
				<FieldGroup>
					<form.Field name="contact2Name">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Nombre completo</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Carlos López"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="contact2Relationship">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Vínculo</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Cónyuge, hermano/a, amigo/a..."
										value={field.state.value ?? ""}
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
			</div>
		</div>
	),
});
