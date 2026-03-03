export class AssetAssignmentNotFoundException extends Error {
  constructor(assignmentId: string) {
    super(`Asset assignment '${assignmentId}' not found.`);
    this.name = 'AssetAssignmentNotFoundException';
  }
}
