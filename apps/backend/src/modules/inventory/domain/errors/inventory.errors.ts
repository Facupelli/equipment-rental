import { DomainError } from 'src/core/exceptions/domain.error';

export class InventoryError extends DomainError {}

export class AssetNotAvailableError extends InventoryError {
  constructor(assetId?: string) {
    super(
      assetId
        ? `Asset '${assetId}' is not available for the requested period.`
        : 'No asset is available for the requested period.',
    );
  }
}

export class SerialNumberRequiredError extends InventoryError {
  constructor(productTypeId: string) {
    super(`A serial number is required for assets of product type '${productTypeId}' with IDENTIFIED tracking mode.`);
  }
}

export class ProductTypeNotFoundError extends InventoryError {
  constructor(productTypeId: string) {
    super(`Product type '${productTypeId}' was not found.`);
  }
}

export class DuplicateSerialNumberError extends InventoryError {
  constructor(serialNumber: string) {
    super(`An asset with serial number '${serialNumber}' already exists.`);
  }
}
