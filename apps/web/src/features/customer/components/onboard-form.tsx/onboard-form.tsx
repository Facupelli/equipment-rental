"use client";

import { useState } from "react";
import { useUploadFiles } from "@better-upload/client";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
} from "lucide-react";
import {
  customerFormSchema,
  customerFormValues,
  stepFields,
  type OnboardFormValues,
  type StepNumber,
} from "../../schemas/onboard-form.schema";
import { useAppForm } from "@/shared/contexts/form.context";
import { Step2Document } from "./onboard-step-2";
import { Step1Personal } from "./onboard-step-1";
import { Step3WorkFinance } from "./onboard-step-3";
import { Step4Contacts } from "./onboard-step-4";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomerFormProps {
  customerId: string;
}

export function CustomerForm({ customerId }: CustomerFormProps) {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  const uploader = useUploadFiles({
    route: "api/customer-upload",
  });

  const form = useAppForm({
    defaultValues: customerFormValues,
    validators: {
      onSubmit: customerFormSchema,
    },
    onSubmit: async ({ value }) => {
      // TODO: replace with your actual API call
      console.log("Customer form submitted:", { value });

      if (!value.identityDocumentFile) {
        return;
      }

      const { files } = await uploader.uploadAsync([
        value.identityDocumentFile,
      ]);
      const imageKey = files[0].objectInfo.key;

      console.log({ imageKey });
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

  // if (form.) {
  // return <Confirmation />;
  // }

  const isBusy = form.state.isSubmitting || uploader.isPending;

  return (
    <div>
      <div className="w-full max-w-lg mx-auto">
        <StepIndicator currentStep={currentStep} />

        <div className="min-h-105">
          {currentStep === 1 && <Step1Personal form={form} />}
          {currentStep === 2 && (
            <Step2Document
              // pendingFile={pendingFile}
              form={form}
              uploader={uploader}
              isUploading={uploader.isPending}
            />
          )}
          {currentStep === 3 && <Step3WorkFinance form={form} />}
          {currentStep === 4 && <Step4Contacts form={form} />}
        </div>

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
            <Button type="button" disabled={isBusy} className="gap-2 min-w-30">
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploader.isPending ? "Subiendo..." : "Enviando..."}
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
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
