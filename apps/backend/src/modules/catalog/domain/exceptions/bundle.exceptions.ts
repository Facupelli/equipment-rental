export class InvalidBundleNameException extends Error {
  constructor() {
    super('Bundle name cannot be empty.');
    this.name = 'InvalidBundleNameException';
  }
}

export class InvalidBundleComponentQuantityException extends Error {
  constructor() {
    super('Bundle component quantity must be greater than zero.');
    this.name = 'InvalidBundleComponentQuantityException';
  }
}

export class DuplicateBundleComponentException extends Error {
  constructor(productTypeId: string) {
    super(`A component for product type '${productTypeId}' already exists in this bundle.`);
    this.name = 'DuplicateBundleComponentException';
  }
}

export class BundleComponentNotFoundException extends Error {
  constructor(productTypeId: string) {
    super(`No component for product type '${productTypeId}' found in this bundle.`);
    this.name = 'BundleComponentNotFoundException';
  }
}
