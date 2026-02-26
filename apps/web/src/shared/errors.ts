import type { ProblemDetails } from "@repo/schemas";

export class ProblemDetailsError extends Error {
  public readonly problemDetails: ProblemDetails;

  constructor(problemDetails: ProblemDetails) {
    super(problemDetails.title);
    this.name = "ProblemDetailsError";
    this.problemDetails = problemDetails;
  }
}
