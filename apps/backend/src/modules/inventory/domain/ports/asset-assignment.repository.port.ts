import { AssetAssignment } from '../entities/asset-assignment.entity';

export abstract class AssetAssignmentRepositoryPort {
  /**
   * Persists a new AssetAssignment.
   * Throws PostgresExclusionViolationError if the EXCLUDE constraint fires
   * (concurrent booking of the same asset for an overlapping period).
   */
  abstract save(assignment: AssetAssignment): Promise<void>;
}
