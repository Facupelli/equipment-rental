import type { ProblemDetails } from "@repo/schemas";

export class ProblemDetailsError extends Error {
	public readonly problemDetails: ProblemDetails;

	constructor(problemDetails: ProblemDetails) {
		super(problemDetails.title);
		this.name = "ProblemDetailsError";
		this.problemDetails = problemDetails;
	}
}

type ProblemDetailsLike = {
	problemDetails?: Partial<ProblemDetails>;
	status?: number;
	message?: string;
	name?: string;
};

const EXCEPTION_STATUS_MAP: Record<string, number> = {
	ForbiddenException: 403,
	UnauthorizedException: 401,
};

export function getProblemDetailsStatus(error: unknown): number | undefined {
	if (error instanceof ProblemDetailsError) {
		return error.problemDetails.status;
	}

	if (!error || typeof error !== "object") {
		return undefined;
	}

	const candidate = error as ProblemDetailsLike;

	if (typeof candidate.problemDetails?.status === "number") {
		return candidate.problemDetails.status;
	}

	if (typeof candidate.status === "number") {
		return candidate.status;
	}

	const exceptionKey =
		typeof candidate.name === "string" && candidate.name in EXCEPTION_STATUS_MAP
			? candidate.name
			: typeof candidate.message === "string" &&
					candidate.message in EXCEPTION_STATUS_MAP
				? candidate.message
				: undefined;

	if (exceptionKey) {
		return EXCEPTION_STATUS_MAP[exceptionKey];
	}

	return undefined;
}

export function isForbiddenError(error: unknown): boolean {
	return getProblemDetailsStatus(error) === 403;
}
