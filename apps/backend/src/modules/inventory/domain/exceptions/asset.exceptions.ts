export class AssetAssignmentNotFoundException extends Error {
  constructor(assignmentId: string) {
    super(`Asset assignment '${assignmentId}' not found.`);
    this.name = 'AssetAssignmentNotFoundException';
  }
}

export class InvalidAssetAssignmentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAssetAssignmentException';
  }
}
