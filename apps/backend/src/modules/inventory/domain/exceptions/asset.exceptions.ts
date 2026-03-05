export class AssetAssignmentNotFoundException extends Error {
  constructor(assignmentId: string) {
    super(`Asset assignment '${assignmentId}' not found.`);
    this.name = 'AssetAssignmentNotFoundException';
  }
}

export class AssetNotAvailableError extends Error {
  constructor() {
    super('Asset is not available for the requested period.');
    this.name = 'AssetNotAvailableError';
  }
}

export class InvalidAssetAssignmentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAssetAssignmentException';
  }
}
