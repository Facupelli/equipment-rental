import { useForm } from "@tanstack/react-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	useOrderDetailContext,
	useOrderSigning,
} from "@/features/orders/contexts/order-detail.context";
import {
	createOrderSigningInvitationFormDefaults,
	orderSigningInvitationFormSchema,
	toOrderSigningInvitationDto,
} from "@/features/orders/schemas/order-signing-invitation-form.schema";

const formId = "order-signing-invitation";

export function OrderSigningInvitationDialog() {
	const { order } = useOrderDetailContext();
	const signing = useOrderSigning();
	const defaultEmail = order.customer?.email ?? "";
	const form = useForm({
		defaultValues: createOrderSigningInvitationFormDefaults(defaultEmail),
		validators: {
			onSubmit: orderSigningInvitationFormSchema,
		},
		onSubmit: async ({ value }) => {
			await signing.submitInvitation(toOrderSigningInvitationDto(value));
		},
	});

	function handleOpenChange(nextOpen: boolean) {
		signing.setIsInvitationDialogOpen(nextOpen);
		form.reset(createOrderSigningInvitationFormDefaults(defaultEmail));
	}

	const isResend = signing.dialogIntent === "resend";

	return (
		<Dialog
			open={signing.isInvitationDialogOpen}
			onOpenChange={handleOpenChange}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isResend
							? "Reenviar invitación de firma"
							: "Enviar invitación de firma"}
					</DialogTitle>
					<DialogDescription>
						Se enviara un enlace seguro por email para revisar y aceptar el
						contrato de alquiler.
					</DialogDescription>
				</DialogHeader>

				{signing.isInvitationDialogOpen ? (
					<>
						<form
							id={formId}
							onSubmit={(event) => {
								event.preventDefault();
								event.stopPropagation();
								void form.handleSubmit();
							}}
							className="space-y-6"
						>
							<FieldGroup>
								{signing.submitError ? (
									<Alert variant="destructive">
										<AlertDescription>{signing.submitError}</AlertDescription>
									</Alert>
								) : null}

								<form.Field name="recipientEmail">
									{(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												Email del firmante
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="email"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												placeholder="cliente@ejemplo.com"
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</form.Field>
							</FieldGroup>
						</form>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
								disabled={signing.isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" form={formId} disabled={signing.isPending}>
								{signing.isPending
									? isResend
										? "Reenviando invitación..."
										: "Enviando invitación..."
									: isResend
										? "Reenviar invitación"
										: "Enviar invitación"}
							</Button>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
