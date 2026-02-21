export interface ProblemDetails {
  /**
   * A URI reference that identifies the problem type.
   * Ideally, this points to documentation.
   */
  type: string;

  /**
   * A short, human-readable summary of the problem type.
   */
  title: string;

  /**
   * The HTTP status code.
   */
  status: number;

  /**
   * A human-readable explanation specific to this occurrence.
   */
  detail: string;

  /**
   * A URI reference that identifies the specific occurrence of the problem.
   * Usually the request path.
   */
  instance?: string;

  /**
   * Optional extensions (e.g., stack trace in dev, validation errors).
   */
  [key: string]: any;
}
