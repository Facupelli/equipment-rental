import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";
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
	const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
	const isMobile = useIsMobile();
	const form = useForm({
		defaultValues: createPublicSigningFormDefaults(session),
		validators: {
			onSubmit: publicSigningFormSchema,
		},
		onSubmit: async ({ value }: { value: PublicSigningFormValues }) => {
			await onSubmit(toAcceptPublicSigningSessionDto(value));
			setIsMobileSheetOpen(false);
		},
	});

	const renderFormFields = (idPrefix: string) => (
		<FieldGroup>
			<form.Field name="declaredFullName">
				{(field) => {
					const isInvalid =
						field.state.meta.isTouched && !field.state.meta.isValid;

					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor={`${idPrefix}-${field.name}`}>
								Nombre completo
							</FieldLabel>
							<Input
								id={`${idPrefix}-${field.name}`}
								name={field.name}
								type="text"
								placeholder="Ej. Jane Doe"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
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
							<FieldLabel htmlFor={`${idPrefix}-${field.name}`}>
								Numero de documento
							</FieldLabel>
							<Input
								id={`${idPrefix}-${field.name}`}
								name={field.name}
								type="text"
								placeholder="Ej. 12345678"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
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
							<div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 sm:px-4">
								<Checkbox
									id={`${idPrefix}-${field.name}`}
									checked={field.state.value}
									onCheckedChange={(checked) => {
										field.handleChange(checked === true);
									}}
									className="mt-0.5 bg-white"
								/>
								<div className="space-y-1">
									<FieldLabel
										htmlFor={`${idPrefix}-${field.name}`}
										className="leading-5"
									>
										Confirmo que revisé el documento y acepto este contrato de
										alquiler.
									</FieldLabel>
									<p className="text-xs leading-5 text-neutral-500">
										Tu aceptación quedará registrada con la fecha y hora de este
										paso.
									</p>
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
	);

	if (isMobile) {
		return (
			<>
				<div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-3 py-3 backdrop-blur-sm">
					<div className="flex">
						<Button
							type="button"
							onClick={() => setIsMobileSheetOpen(true)}
							disabled={isPending}
							className="w-full"
						>
							Continuar para firmar
						</Button>
					</div>
				</div>

				<Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
					<SheetContent
						side="bottom"
						className="max-h-[92svh] rounded-t-3xl border-neutral-200 px-0 pb-0"
					>
						<div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-neutral-300" />
						<SheetHeader className="gap-2 px-4 pb-3 pt-2 text-left">
							<SheetTitle className="text-lg font-semibold text-neutral-950">
								Confirma tus datos y acepta el contrato
							</SheetTitle>
						</SheetHeader>

						<div className="overflow-y-auto px-4 pb-4">
							<Separator className="my-4" />

							<form
								id={`${formId}-mobile`}
								onSubmit={(event) => {
									event.preventDefault();
									event.stopPropagation();
									void form.handleSubmit();
								}}
								className="space-y-3"
								noValidate
							>
								{renderFormFields("mobile")}
							</form>
						</div>

						<SheetFooter className="border-t border-neutral-200 bg-white px-4 py-3">
							<Button
								type="submit"
								form={`${formId}-mobile`}
								disabled={isPending}
								className="w-full"
							>
								{isPending ? "Registrando..." : "Aceptar y firmar contrato"}
							</Button>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			</>
		);
	}

	return (
		<Card className="gap-2 border-neutral-200 bg-white lg:sticky lg:top-6">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg font-semibold text-neutral-950">
					Confirma tu identidad
				</CardTitle>
				<CardDescription className="text-sm leading-6 text-neutral-600">
					Completa tus datos despues de revisar el contrato para registrar tu
					aceptación.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					id={formId}
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-3"
					noValidate
				>
					{renderFormFields("desktop")}
				</form>
			</CardContent>
			<CardFooter className="flex-col items-stretch gap-3 pt-2">
				<Button
					type="submit"
					form={formId}
					disabled={isPending}
					className="w-full"
				>
					{isPending ? "Registrando..." : "Aceptar y firmar contrato"}
				</Button>
			</CardFooter>
		</Card>
	);
}
