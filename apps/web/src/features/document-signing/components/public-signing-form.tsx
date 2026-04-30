import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ParsedPublicSigningSessionResponseDto } from "../document-signing.queries";
import {
	createPublicSigningFormDefaults,
	type PublicSigningFormValues,
	publicSigningFormSchema,
	toAcceptPublicSigningSessionDto,
} from "../public-signing-form.schema";

const formId = "public-signing-form";

type PublicSigningFormProps = {
	session: ParsedPublicSigningSessionResponseDto;
	submitError: string | null;
	isPending: boolean;
	onSubmit: (
		dto: ReturnType<typeof toAcceptPublicSigningSessionDto>,
	) => Promise<void>;
};

export function PublicSigningForm({
	session,
	submitError,
	isPending,
	onSubmit,
}: PublicSigningFormProps) {
	const form = useForm({
		defaultValues: createPublicSigningFormDefaults(session),
		validators: {
			onSubmit: publicSigningFormSchema,
		},
		onSubmit: async ({ value }: { value: PublicSigningFormValues }) => {
			await onSubmit(toAcceptPublicSigningSessionDto(value));
		},
	});

	return (
		<Card className="border-neutral-200 bg-white lg:sticky lg:top-6 gap-2">
			<CardHeader>
				<CardTitle className="text-lg font-semibold text-neutral-950">
					Confirma tu identidad
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					id={formId}
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-2"
					noValidate
				>
					<FieldGroup>
						<form.Field name="declaredFullName">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Nombre completo
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder="Ej. Jane Doe"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
										/>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="declaredDocumentNumber">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Numero de documento
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder="Ej. 12345678"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
										/>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="accepted">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
											<Checkbox
												id={field.name}
												checked={field.state.value}
												onCheckedChange={(checked) => {
													field.handleChange(checked === true);
												}}
												className="mt-0.5 bg-white"
											/>
											<div className="space-y-1.5">
												<FieldLabel htmlFor={field.name} className="leading-5">
													Confirmo que revisé el documento y acepto este
													contrato de alquiler.
												</FieldLabel>
											</div>
										</div>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>

						{submitError ? <FieldError>{submitError}</FieldError> : null}
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter className="flex-col items-stretch gap-3 pt-2">
				<Button
					type="submit"
					form={formId}
					disabled={isPending}
					className="w-full"
				>
					{isPending
						? "Registrando aceptacion..."
						: "Aceptar y firmar contrato"}
				</Button>
			</CardFooter>
		</Card>
	);
}
