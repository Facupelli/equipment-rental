import { useForm } from "@tanstack/react-form";
import { Maximize2, PenLine, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
	createPublicSigningFormDefaults,
	type PublicSigningFormValues,
	publicSigningFormSchema,
	toAcceptPublicSigningSessionDto,
} from "../public-signing-form.schema";
import { SignaturePadField } from "./signature-pad-field";

const formId = "public-signing-form";

type PublicSigningFormProps = {
	submitError: string | null;
	isPending: boolean;
	onSubmit: (
		dto: ReturnType<typeof toAcceptPublicSigningSessionDto>,
	) => Promise<void>;
};

export function PublicSigningForm({
	submitError,
	isPending,
	onSubmit,
}: PublicSigningFormProps) {
	const [isSigningPanelOpen, setIsSigningPanelOpen] = useState(false);
	const [signatureValue, setSignatureValue] = useState("");
	const [acceptedValue, setAcceptedValue] = useState(false);

	const form = useForm({
		defaultValues: createPublicSigningFormDefaults(),
		validators: {
			onSubmit: publicSigningFormSchema,
		},
		onSubmit: async ({ value }: { value: PublicSigningFormValues }) => {
			await onSubmit(toAcceptPublicSigningSessionDto(value));
			setIsSigningPanelOpen(false);
		},
	});

	const canSubmit = Boolean(signatureValue) && acceptedValue && !isPending;

	const docusealAcceptedId = useId();

	return (
		<>
			{isSigningPanelOpen ? null : (
				<div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 sm:px-6 sm:pb-5">
					<div className="mx-auto flex w-full max-w-2xl">
						<Button
							type="button"
							onClick={() => setIsSigningPanelOpen(true)}
							disabled={isPending}
							className="h-12 w-full rounded-2xl uppercase px-4"
						>
							<span className="flex-1" />
							<span className="flex items-center gap-2">
								<PenLine className="size-5" aria-hidden="true" />
								Firmar ahora
							</span>
							<span className="flex flex-1 justify-end">
								<Maximize2 className="size-4" aria-hidden="true" />
							</span>
						</Button>
					</div>
				</div>
			)}

			{isSigningPanelOpen ? (
				<div className="fixed inset-x-0 bottom-0 z-30 px-0 sm:px-6 sm:pb-6">
					<div className="mx-auto max-h-[82svh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border shadow md:rounded-sm border-neutral-400 bg-white p-2 md:p-6">
						<div className="mb-2 flex justify-end sm:mb-0">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => setIsSigningPanelOpen(false)}
								className="size-8 rounded-none text-neutral-950 hover:bg-neutral-100"
								aria-label="Cerrar panel de firma"
							>
								<X className="size-5" />
							</Button>
						</div>
						<form
							id={formId}
							onSubmit={(event) => {
								event.preventDefault();
								event.stopPropagation();
								void form.handleSubmit();
							}}
							className="space-y-4"
							noValidate
						>
							<form.Field name="signatureImageDataUrl">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid}>
											<SignaturePadField
												id={`docuseal-${field.name}`}
												description={null}
												clearLabel="Redibujar"
												value={field.state.value}
												disabled={isPending}
												isInvalid={isInvalid}
												onChange={(value) => {
													const nextValue = value ?? "";
													field.handleChange(nextValue);
													setSignatureValue(nextValue);
												}}
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
											<div className="flex items-start gap-2 px-2">
												<Checkbox
													id={docusealAcceptedId}
													checked={field.state.value}
													onCheckedChange={(checked) => {
														const nextValue = checked === true;
														field.handleChange(nextValue);
														setAcceptedValue(nextValue);
													}}
													className="mt-0.5 size-4 rounded-none border-neutral-950 bg-white"
												/>
												<FieldLabel
													htmlFor={docusealAcceptedId}
													className="text-xs text-neutral-800 sm:text-sm"
												>
													Confirmo que revisé el documento y acepto este
													contrato de alquiler.
												</FieldLabel>
											</div>
											{isInvalid ? (
												<FieldError errors={field.state.meta.errors} />
											) : null}
										</Field>
									);
								}}
							</form.Field>

							{submitError ? <FieldError>{submitError}</FieldError> : null}
						</form>

						<Button
							type="submit"
							form={formId}
							disabled={!canSubmit}
							className="mt-4 h-12 w-full border-2 rounded-2xl border-neutral-950 bg-neutral-950 text-sm font-semibold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none sm:text-base"
						>
							{isPending ? "Registrando..." : "Firmar y completar"}
						</Button>
					</div>
				</div>
			) : null}
		</>
	);
}
