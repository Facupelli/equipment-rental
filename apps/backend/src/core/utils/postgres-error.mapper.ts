// Postgres error code for exclusion constraint violation (gist overlap)
const PG_EXCLUSION_VIOLATION = '23P01';
const PG_FOREIGN_KEY_VIOLATION = 'P2003';

/**
 * Typed error thrown when a Postgres EXCLUDE constraint fires.
 * Callers catch this specifically — it is not a generic DB error.
 */
export class PostgresExclusionViolationError extends Error {
  constructor() {
    super('A database exclusion constraint was violated.');
    this.name = 'PostgresExclusionViolationError';
  }
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return isPostgresError(error) && error.code === PG_FOREIGN_KEY_VIOLATION;
}

type PostgresError = {
  code: string;
};

function isPostgresError(error: unknown): error is PostgresError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/**
 * Maps known Postgres error codes to typed domain errors.
 * Always re-throws — either as a typed error or as the original unknown error.
 *
 * Usage:
 *   try {
 *     await prisma.$executeRaw`INSERT ...`
 *   } catch (error) {
 *     mapPostgresError(error); // throws PostgresExclusionViolationError or re-throws original
 *   }
 */
export function mapPostgresError(error: unknown): never {
  if (isPostgresError(error) && error.code === PG_EXCLUSION_VIOLATION) {
    throw new PostgresExclusionViolationError();
  }
  throw error;
}
