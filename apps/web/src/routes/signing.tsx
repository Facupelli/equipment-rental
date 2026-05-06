import { createFileRoute } from "@tanstack/react-router";
import {
	Download,
	FileCheck2,
	FileSearch,
	Link2Off,
	ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PublicSigningForm } from "@/features/document-signing/components/public-signing-form";
import { PublicSigningPdfViewer } from "@/features/document-signing/components/public-signing-pdf-viewer";
import { PublicSigningTerminalState } from "@/features/document-signing/components/public-signing-terminal-state";
import {
	getPublicSigningSignedPdfUrl,
	getPublicSigningUnsignedPdfUrl,
} from "@/features/document-signing/document-signing.api";
import {
	type ParsedAcceptPublicSigningSessionResponseDto,
	useAcceptPublicSigningSession,
	usePublicSigningSession,
} from "@/features/document-signing/document-signing.queries";
import type { toAcceptPublicSigningSessionDto } from "@/features/document-signing/public-signing-form.schema";
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
			enabled: Boolean(token) && !successResult,
			retry: false,
		},
	);
	const acceptMutation = useAcceptPublicSigningSession();

	const submitSign = async (
		dto: ReturnType<typeof toAcceptPublicSigningSessionDto>,
	) => {
		setSubmitError(null);
		setUnexpectedTerminalMessage(null);

		if (!token) {
			setSubmitError("No pudimos verificar tu identidad. Intenta nuevamente.");
			return;
		}

		try {
			const result = await acceptMutation.mutateAsync({ token, dto });
			setSuccessResult(result);
		} catch (error) {
			const status = getProblemDetailsStatus(error) ?? null;
			const message = getProblemDetailsMessage(error);

			if (status === 422) {
				setSubmitError(message ?? "No pudimos registrar tu aceptación.");
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

			if (error instanceof ProblemDetailsError || error instanceof Error) {
				setUnexpectedTerminalMessage(message);
				return;
			}

			throw error;
		}
	};

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
				title="Contrato firmado correctamente"
				description="Tu firma quedó registrada. Ya puedes descargar la versión firmada del contrato."
				detail={`Firmado el ${successResult.signedAt.format("DD/MM/YYYY HH:mm")}.`}
				actionLabel="Descargar PDF firmado"
				actionHref={getPublicSigningSignedPdfUrl(token)}
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
	const unsignedPdfUrl = getPublicSigningUnsignedPdfUrl(token);

	return (
		<div className="h-svh overflow-hidden bg-neutral-100 text-neutral-950">
			<header className="h-14 border-b-2 border-neutral-950 bg-white sm:h-16">
				<div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-3 sm:px-6">
					<h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight sm:text-2xl">
						{session.document.displayFileName}
					</h1>
					<Button
						type="button"
						variant="secondary"
						className="hidden h-8 rounded-none border-2 border-neutral-950 bg-neutral-100 px-5 text-sm font-semibold uppercase text-neutral-950 hover:bg-neutral-200 sm:inline-flex"
						disabled
					>
						Rechazar
					</Button>
					<Button
						className="h-8 rounded-none bg-neutral-950 px-3 text-white hover:bg-neutral-800 sm:px-5 sm:text-sm sm:font-semibold sm:uppercase"
						render={
							<a href={unsignedPdfUrl} download>
								<Download className="size-4" />
								<span className="hidden sm:inline">Descargar</span>
							</a>
						}
					/>
				</div>
			</header>

			<main className="mx-auto h-[calc(100svh-3.5rem)] max-w-5xl px-0 sm:h-[calc(100svh-4rem)] sm:px-6">
				<div className="h-full">
					<PublicSigningPdfViewer
						documentNumber={session.document.documentNumber}
						src={unsignedPdfUrl}
					/>

					{successResult ? null : (
						<PublicSigningForm
							key={session.requestId}
							submitError={submitError}
							isPending={acceptMutation.isPending}
							onSubmit={(dto) => submitSign(dto)}
						/>
					)}
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
