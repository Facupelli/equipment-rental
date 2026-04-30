import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, FileSearch, Link2Off, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Spinner } from "@/components/ui/spinner";
import { PublicSigningForm } from "@/features/document-signing/components/public-signing-form";
import { PublicSigningPdfViewer } from "@/features/document-signing/components/public-signing-pdf-viewer";
import { PublicSigningSessionPanel } from "@/features/document-signing/components/public-signing-session-panel";
import { PublicSigningTerminalState } from "@/features/document-signing/components/public-signing-terminal-state";
import { getPublicSigningUnsignedPdfUrl } from "@/features/document-signing/document-signing.api";
import {
	type ParsedAcceptPublicSigningSessionResponseDto,
	useAcceptPublicSigningSession,
	usePublicSigningSession,
} from "@/features/document-signing/document-signing.queries";
import { getProblemDetailsStatus, ProblemDetailsError } from "@/shared/errors";

const signingSearchSchema = z.object({
	token: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/signing")({
	validateSearch: signingSearchSchema,
	head: () => ({
		meta: [
			{
				title: "Firma de contrato | Depiqo",
			},
		],
	}),
	component: SigningPage,
});

function SigningPage() {
	const { token } = Route.useSearch();
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [terminalStatus, setTerminalStatus] = useState<number | null>(null);
	const [unexpectedTerminalMessage, setUnexpectedTerminalMessage] = useState<
		string | null
	>(null);
	const [successResult, setSuccessResult] =
		useState<ParsedAcceptPublicSigningSessionResponseDto | null>(null);

	const sessionQuery = usePublicSigningSession(
		{ token: token ?? "" },
		{
			enabled: Boolean(token),
			retry: false,
		},
	);
	const acceptMutation = useAcceptPublicSigningSession();

	if (!token) {
		return (
			<PublicSigningTerminalState
				icon={Link2Off}
				title="Falta el enlace de firma"
				description="Abre nuevamente el link completo que recibiste por email para revisar y aceptar tu contrato."
			/>
		);
	}

	if (successResult) {
		return (
			<PublicSigningTerminalState
				icon={FileCheck2}
				title="Contrato aceptado correctamente"
				description="Tu aceptación quedó registrada. La copia final firmada se enviará por email mediante un enlace seguro."
				detail={`Aceptado el ${successResult.acceptedAt.format("DD/MM/YYYY HH:mm")}.`}
			/>
		);
	}

	if (terminalStatus !== null || unexpectedTerminalMessage) {
		return renderTerminalState(terminalStatus, unexpectedTerminalMessage);
	}

	if (sessionQuery.isPending) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-neutral-100 px-4 py-10">
				<div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-600 shadow-xs">
					<Spinner className="size-4" />
					<span>Cargando contrato para firma...</span>
				</div>
			</div>
		);
	}

	if (sessionQuery.isError) {
		return renderTerminalState(
			getProblemDetailsStatus(sessionQuery.error) ?? null,
			getProblemDetailsMessage(sessionQuery.error),
		);
	}

	const session = sessionQuery.data;

	if (session.status === "SIGNED") {
		return renderTerminalState(409, null);
	}

	if (session.status === "VOIDED") {
		return renderTerminalState(409, null);
	}

	return (
		<div className="min-h-svh bg-neutral-100">
			<main className="mx-auto max-w-6xl px-3 py-3 pb-24 sm:px-6 sm:py-6 sm:pb-6 lg:py-8 lg:pb-8">
				<div className="space-y-3 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:space-y-0">
					<div className="space-y-3 sm:space-y-4">
						<div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 lg:hidden">
							<p className="text-[10px] text-neutral-500 uppercase">
								VENCE: {session.expiresAt.format("DD/MM/YYYY HH:mm")}
							</p>
						</div>

						<div className="hidden lg:block">
							<PublicSigningSessionPanel session={session} />
						</div>
						<PublicSigningPdfViewer
							documentNumber={session.document.documentNumber}
							src={getPublicSigningUnsignedPdfUrl(token)}
						/>
					</div>

					<PublicSigningForm
						key={session.sessionId}
						session={session}
						submitError={submitError}
						isPending={acceptMutation.isPending}
						onSubmit={async (dto) => {
							setSubmitError(null);
							setUnexpectedTerminalMessage(null);

							try {
								const result = await acceptMutation.mutateAsync({ token, dto });
								setSuccessResult(result);
							} catch (error) {
								const status = getProblemDetailsStatus(error) ?? null;
								const message = getProblemDetailsMessage(error);

								if (status === 422) {
									setSubmitError(
										message ?? "No pudimos registrar tu aceptación.",
									);
									return;
								}

								if (
									status === 401 ||
									status === 404 ||
									status === 409 ||
									status === 410
								) {
									setTerminalStatus(status);
									return;
								}

								if (
									error instanceof ProblemDetailsError ||
									error instanceof Error
								) {
									setUnexpectedTerminalMessage(message);
									return;
								}

								throw error;
							}
						}}
					/>
				</div>
			</main>
		</div>
	);
}

function renderTerminalState(status: number | null, message: string | null) {
	switch (status) {
		case 401:
			return (
				<PublicSigningTerminalState
					icon={ShieldAlert}
					title="No pudimos validar este acceso"
					description="El enlace de firma no es valido o esta incompleto. Abre nuevamente el email original para continuar."
					detail={message ?? undefined}
				/>
			);
		case 404:
			return (
				<PublicSigningTerminalState
					icon={Link2Off}
					title="Enlace de firma no disponible"
					description="No encontramos una sesion activa para este enlace. Revisa que el link sea el correcto o solicita uno nuevo."
					detail={message ?? undefined}
				/>
			);
		case 409:
			return (
				<PublicSigningTerminalState
					icon={FileCheck2}
					title="Esta firma ya no esta disponible"
					description="Este contrato ya fue firmado o la sesion fue reemplazada por una version nueva. Si necesitas ayuda, contacta al negocio."
					detail={message ?? undefined}
				/>
			);
		case 410:
			return (
				<PublicSigningTerminalState
					icon={FileSearch}
					title="El enlace de firma vencio"
					description="La invitacion ya expiro. Solicita al negocio que te envie una nueva invitacion para continuar."
					detail={message ?? undefined}
				/>
			);
		default:
			return (
				<PublicSigningTerminalState
					icon={ShieldAlert}
					title="No pudimos cargar la firma"
					description="Ocurrio un problema inesperado al abrir este contrato. Intenta nuevamente en unos minutos."
					detail={message ?? undefined}
				/>
			);
	}
}

function getProblemDetailsMessage(error: unknown): string | null {
	if (error instanceof ProblemDetailsError) {
		return error.problemDetails.detail || error.problemDetails.title;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return null;
}
