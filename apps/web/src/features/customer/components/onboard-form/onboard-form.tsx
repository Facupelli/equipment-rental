import { useUploadFiles } from "@better-upload/client";
import { customerProfileSchema } from "@repo/schemas";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	CheckCircle2,
	Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	useResubmitCustomerProfile,
	useSubmitCustomerProfile,
} from "@/features/rental/customer/customer.queries";
import { cn } from "@/lib/utils";
import { useAppForm } from "@/shared/contexts/form.context";
import { ProblemDetailsError } from "@/shared/errors";
import {
	customerFormSchema,
	customerFormValues,
	type OnboardFormValues,
	type StepNumber,
	stepFields,
} from "../../schemas/onboard-form.schema";
import { Step1Personal } from "./onboard-step-1";
import { Step2Document } from "./onboard-step-2";
import { Step3WorkFinance } from "./onboard-step-3";
import { Step4Contacts } from "./onboard-step-4";

interface CustomerFormProps {
	customerId: string;
	defaultValues?: Partial<OnboardFormValues>;
	mode?: "submit" | "resubmit";
}

function toNullableString(value: string): string | null {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function CustomerForm({
	customerId,
	defaultValues,
	mode = "submit",
}: CustomerFormProps) {
	const submitMutation = useSubmitCustomerProfile();
	const resubmitMutation = useResubmitCustomerProfile();
	const [currentStep, setCurrentStep] = useState<StepNumber>(1);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const uploader = useUploadFiles({
		api: "/api/customer-upload",
		route: "identityDocument",
	});

	const form = useAppForm({
		defaultValues: {
			...customerFormValues,
			...defaultValues,
		},
		validators: {
			onSubmit: customerFormSchema,
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);

			try {
				let identityDocumentPath = value.existingIdentityDocumentPath;

				if (value.identityDocumentFile) {
					const result = await uploader.uploadAsync(
						[value.identityDocumentFile],
						{
							metadata: { customerId },
						},
					);
					identityDocumentPath = result.files[0]?.objectInfo.key ?? null;
				}

				if (!identityDocumentPath) {
					setSubmitError("Subí un documento o conservá el archivo actual.");
					return;
				}

				const payload = customerProfileSchema.parse({
					fullName: value.fullName,
					phone: value.phone,
					birthDate: value.birthDate,
					documentNumber: value.documentNumber,
					identityDocumentPath,
					address: value.address,
					city: value.city,
					stateRegion: value.stateRegion,
					country: value.country,
					occupation: value.occupation,
					company: toNullableString(value.company),
					taxId: toNullableString(value.taxId),
					businessName: toNullableString(value.businessName),
					bankName: value.bankName,
					accountNumber: value.accountNumber,
					contact1Name: value.contact1Name,
					contact1Relationship: value.contact1Relationship,
					contact2Name: value.contact2Name,
					contact2Relationship: value.contact2Relationship,
				});

				if (mode === "resubmit") {
					await resubmitMutation.mutateAsync(payload);
				} else {
					await submitMutation.mutateAsync(payload);
				}

				setIsSubmitted(true);
			} catch (error) {
				if (error instanceof ProblemDetailsError) {
					setSubmitError(error.problemDetails.detail);
					return;
				}

				setSubmitError(
					error instanceof Error
						? error.message
						: "No pudimos enviar tus datos. Intentá nuevamente.",
				);
			}
		},
	});

	// ---------------------------------------------------------------------------
	// Per-step validation — validates only the active step's fields, then touches
	// them so errors become visible in the UI.
	// ---------------------------------------------------------------------------
	const validateCurrentStep = async (): Promise<boolean> => {
		const fields = stepFields[currentStep];

		const results = await Promise.all(
			fields.map((name) =>
				form.validateField(name as keyof OnboardFormValues, "change"),
			),
		);

		fields.forEach((name) => {
			form.setFieldMeta(name as keyof OnboardFormValues, (prev) => ({
				...prev,
				isTouched: true,
			}));
		});

		return results.every((errors) => !errors || errors.length === 0);
	};

	const handleNext = async () => {
		const valid = await validateCurrentStep();
		if (!valid) {
			return;
		}
		setCurrentStep((s) => Math.min(s + 1, 4) as StepNumber);
	};

	const handleBack = () => {
		setCurrentStep((s) => Math.max(s - 1, 1) as StepNumber);
	};

	if (isSubmitted) {
		return <Confirmation />;
	}

	const isBusy =
		form.state.isSubmitting ||
		uploader.isPending ||
		submitMutation.isPending ||
		resubmitMutation.isPending;

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className="w-full max-w-lg mx-auto">
				<StepIndicator currentStep={currentStep} />

				<div className="min-h-105">
					{currentStep === 1 && <Step1Personal form={form} />}
					{currentStep === 2 && (
						<Step2Document
							form={form}
							uploader={uploader}
							isUploading={uploader.isPending}
						/>
					)}
					{currentStep === 3 && <Step3WorkFinance form={form} />}
					{currentStep === 4 && <Step4Contacts form={form} />}
				</div>

				{submitError ? (
					<p className="mt-4 text-sm text-destructive">{submitError}</p>
				) : null}

				<div className="flex items-center justify-between mt-8 pt-4 border-t">
					<Button
						type="button"
						variant="ghost"
						onClick={handleBack}
						disabled={currentStep === 1 || isBusy}
						className="gap-2"
					>
						<ArrowLeft className="w-4 h-4" />
						Atrás
					</Button>

					{currentStep < 4 ? (
						<Button
							type="button"
							onClick={handleNext}
							disabled={isBusy}
							className="gap-2"
						>
							Siguiente
							<ArrowRight className="w-4 h-4" />
						</Button>
					) : (
						<Button type="submit" disabled={isBusy} className="gap-2 min-w-30">
							{isBusy ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									{uploader.isPending ? "Subiendo..." : "Enviando..."}
								</>
							) : mode === "resubmit" ? (
								"Reenviar"
							) : (
								"Enviar"
							)}
						</Button>
					)}
				</div>
			</div>
		</form>
	);
}

const STEPS = [
	{ number: 1, label: "Personal" },
	{ number: 2, label: "Documento" },
	{ number: 3, label: "Trabajo" },
	{ number: 4, label: "Contactos" },
];

interface StepIndicatorProps {
	currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
	return (
		<div className="flex items-center justify-center gap-0 w-full mb-8">
			{STEPS.map((step, idx) => {
				const isCompleted = currentStep > step.number;
				const isActive = currentStep === step.number;

				return (
					<div key={step.number} className="flex items-center">
						{/* Step circle + label */}
						<div className="flex flex-col items-center gap-1.5">
							<div
								className={cn(
									"w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300",
									isCompleted &&
										"bg-primary border-primary text-primary-foreground",
									isActive && "border-primary text-primary bg-primary/10",
									!isCompleted &&
										!isActive &&
										"border-muted-foreground/30 text-muted-foreground/50",
								)}
							>
								{isCompleted ? (
									<Check className="w-4 h-4" />
								) : (
									<span>{step.number}</span>
								)}
							</div>
							<span
								className={cn(
									"text-xs font-medium transition-colors duration-300 hidden sm:block",
									isActive && "text-primary",
									isCompleted && "text-primary/70",
									!isActive && !isCompleted && "text-muted-foreground/40",
								)}
							>
								{step.label}
							</span>
						</div>

						{/* Connector line — skip after last step */}
						{idx < STEPS.length - 1 && (
							<div
								className={cn(
									"h-0.5 w-12 sm:w-20 mx-1 mb-5 rounded-full transition-all duration-500",
									currentStep > step.number
										? "bg-primary"
										: "bg-muted-foreground/20",
								)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

function Confirmation() {
	return (
		<div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
			<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
				<CheckCircle2 className="w-9 h-9 text-primary" />
			</div>
			<h2 className="text-2xl font-semibold tracking-tight">¡Todo listo!</h2>
			<p className="text-muted-foreground max-w-sm">
				Tus datos fueron enviados correctamente. Nos pondremos en contacto con
				vos a la brevedad para confirmar tu solicitud.
			</p>
		</div>
	);
}
