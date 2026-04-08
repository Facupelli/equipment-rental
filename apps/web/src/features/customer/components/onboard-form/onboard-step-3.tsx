import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { withForm } from "@/shared/contexts/form.context";
import { customerFormValues } from "../../schemas/onboard-form.schema";

export const Step3WorkFinance = withForm({
	defaultValues: customerFormValues,
	render: ({ form }) => (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold tracking-tight">
					Trabajo y finanzas
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Esta información es opcional pero nos ayuda a conocerte mejor.
				</p>
			</div>

			<div className="space-y-4">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Empleo
				</p>
				<FieldGroup>
					<form.Field name="occupation">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Ocupación{" "}
										<span className="text-muted-foreground font-normal">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Empleado, comerciante, estudiante..."
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

					<form.Field name="company">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Empresa{" "}
										<span className="text-muted-foreground font-normal">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Nombre de la empresa donde trabajás"
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

			<div className="space-y-4">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Información fiscal
				</p>
				<FieldGroup>
					<form.Field name="taxId">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Identificación fiscal{" "}
										<span className="text-muted-foreground font-normal">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="CUIT / NIF / CIF / otro"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									<FieldDescription>
										Argentina: CUIT (ej: 20-12345678-9). España: NIF o CIF.
										Otros: número de identificación fiscal correspondiente.
									</FieldDescription>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="businessName">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Razón social{" "}
										<span className="text-muted-foreground font-normal">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Nombre legal de la empresa"
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

			<div className="space-y-4">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Datos bancarios
				</p>
				<FieldGroup>
					<form.Field name="bankName">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Banco{" "}
										<span className="text-muted-foreground font-normal">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Banco Nación, Santander, BBVA..."
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

					<form.Field name="accountNumber">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Número de cuenta{" "}
										<span className="text-muted-foreground font-normal">
											(opcional)
										</span>
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="CBU / CVU / IBAN / número de cuenta"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									<FieldDescription>
										Argentina: CBU o CVU. España: IBAN. Otros: número de cuenta
										bancaria.
									</FieldDescription>
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
