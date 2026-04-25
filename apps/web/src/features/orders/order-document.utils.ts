import type { GenerateOrderBudgetRequestDto } from "@repo/schemas";

export type ContractErrorState = {
	status: number;
	message: string;
	action: "open" | "download";
} | null;

export function openPreviewWindow() {
	const previewWindow = window.open("", "_blank");

	if (previewWindow) {
		previewWindow.opener = null;
	}

	return previewWindow;
}

export async function preflightContractRequest({
	url,
	onBusinessError,
	onRequestError,
	fallbackMessage,
	notFoundMessage,
	action,
}: {
	url: string;
	onBusinessError: (message: string) => void;
	onRequestError: (error: {
		status: number;
		message: string;
		action: "open" | "download";
	}) => void;
	fallbackMessage: string;
	notFoundMessage: string;
	action: "open" | "download";
}): Promise<boolean> {
	try {
		const response = await fetch(url, {
			method: "GET",
			credentials: "same-origin",
		});

		if (response.ok) {
			return true;
		}

		const payload = (await response.json().catch(() => null)) as {
			message?: string;
		} | null;

		if (response.status === 422) {
			onBusinessError(payload?.message ?? fallbackMessage);
			return false;
		}

		onRequestError({
			status: response.status,
			action,
			message:
				payload?.message ??
				(response.status === 404 ? notFoundMessage : fallbackMessage),
		});
		return false;
	} catch {
		onRequestError({
			status: 500,
			message: fallbackMessage,
			action,
		});
		return false;
	}
}

export async function fetchDocumentBlob({
	url,
	method,
	body,
	fallbackMessage,
	notFoundMessage,
}: {
	url: string;
	method: "POST";
	body: GenerateOrderBudgetRequestDto;
	fallbackMessage: string;
	notFoundMessage: string;
}): Promise<
	| { ok: true; blob: Blob; fileName: string | null }
	| { ok: false; status: number; message: string; isBusinessError: boolean }
> {
	try {
		const response = await fetch(url, {
			method,
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (response.ok) {
			return {
				ok: true,
				blob: await response.blob(),
				fileName: getFileNameFromContentDisposition(
					response.headers.get("Content-Disposition"),
				),
			};
		}

		const payload = (await response.json().catch(() => null)) as {
			message?: string;
		} | null;
		const message =
			payload?.message ??
			(response.status === 404 ? notFoundMessage : fallbackMessage);

		return {
			ok: false,
			status: response.status || 500,
			message,
			isBusinessError: response.status === 422,
		};
	} catch {
		return {
			ok: false,
			status: 500,
			message: fallbackMessage,
			isBusinessError: false,
		};
	}
}

function getFileNameFromContentDisposition(
	contentDisposition: string | null,
): string | null {
	if (!contentDisposition) {
		return null;
	}

	const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

	if (utf8Match?.[1]) {
		return decodeURIComponent(utf8Match[1]);
	}

	const asciiMatch = contentDisposition.match(/filename="?([^\"]+)"?/i);
	return asciiMatch?.[1] ?? null;
}
