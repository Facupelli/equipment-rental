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

export class SerialNumberRequiredException extends Error {
  constructor() {
    super('A serial number is required for assets with IDENTIFIED tracking mode.');
    this.name = 'SerialNumberRequiredException';
  }
}

export class ProductTypeNotFoundError extends Error {
  constructor(productTypeId: string) {
    super(`Product type '${productTypeId}' was not found.`);
    this.name = 'ProductTypeNotFoundError';
  }
}

export class DuplicateSerialNumberError extends Error {
  constructor(serialNumber: string) {
    super(`An asset with serial number '${serialNumber}' already exists.`);
    this.name = 'DuplicateSerialNumberError';
  }
}
