import { DomainError } from 'src/core/exceptions/domain.error';

export class CatalogError extends DomainError {}

export class ProductTypeNotFoundError extends CatalogError {
  constructor(productTypeId: string) {
    super(`Product type '${productTypeId}' was not found.`);
  }
}

export class ProductCategoryNotFoundError extends CatalogError {
  constructor(productCategoryId: string) {
    super(`Product category '${productCategoryId}' was not found.`);
  }
}

export class ProductCategoryHasAssignedProductTypesError extends CatalogError {
  constructor(productCategoryId: string) {
    super(`Product category '${productCategoryId}' cannot be deleted because it still has assigned product types.`);
  }
}

export class ReferencedProductTypeNotFoundError extends CatalogError {
  constructor(productTypeId: string) {
    super(`Referenced product type '${productTypeId}' was not found.`);
  }
}

export class BundleNotFoundError extends CatalogError {
  constructor(bundleId: string) {
    super(`Bundle '${bundleId}' was not found.`);
  }
}

export class InvalidProductTypeNameError extends CatalogError {
  constructor() {
    super('Product type name cannot be empty.');
  }
}

export class ProductTypeAlreadyRetiredError extends CatalogError {
  constructor() {
    super('This product type is already retired.');
  }
}

export class ProductTypeAlreadyPublishedError extends CatalogError {
  constructor() {
    super('This product type is already published.');
  }
}

export class ProductTypeCannotBePublishedWithoutPricingTiersError extends CatalogError {
  constructor(productTypeId: string) {
    super(`Product type '${productTypeId}' cannot be published without at least one pricing tier.`);
  }
}

export class InvalidProductCategoryNameError extends CatalogError {
  constructor() {
    super('Product category name cannot be empty.');
  }
}

export class InvalidBundleNameError extends CatalogError {
  constructor() {
    super('Bundle name cannot be empty.');
  }
}

export class InvalidBundleComponentQuantityError extends CatalogError {
  constructor() {
    super('Bundle component quantity must be greater than zero.');
  }
}

export class DuplicateBundleComponentError extends CatalogError {
  constructor(productTypeId: string) {
    super(`A component for product type '${productTypeId}' already exists in this bundle.`);
  }
}

export class BundleComponentNotFoundError extends CatalogError {
  constructor(productTypeId: string) {
    super(`No component for product type '${productTypeId}' found in this bundle.`);
  }
}

export class BundleAlreadyRetiredError extends CatalogError {
  constructor() {
    super('This bundle is already retired.');
  }
}

export class BundleAlreadyPublishedError extends CatalogError {
  constructor() {
    super('This bundle is already published.');
  }
}

export class BundleCannotBePublishedWithoutPricingTiersError extends CatalogError {
  constructor(bundleId: string) {
    super(`Bundle '${bundleId}' cannot be published without at least one pricing tier.`);
  }
}
