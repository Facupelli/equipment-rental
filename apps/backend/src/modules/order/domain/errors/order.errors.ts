import { DomainError } from 'src/core/exceptions/domain.error';

export class OrderError extends DomainError {}

export class OrderMustContainItemsError extends OrderError {
  constructor() {
    super('An order must contain at least one item.');
  }
}

export class NoActiveContractForAssetError extends OrderError {
  constructor(assetId: string, ownerId: string) {
    super(`Asset "${assetId}" belongs to owner "${ownerId}" but has no active contract.`);
  }
}

export class InvalidPickupSlotError extends OrderError {
  constructor(time: number) {
    super(`Pickup time ${time} is not a valid slot for the selected location and date.`);
  }
}

export class InvalidReturnSlotError extends OrderError {
  constructor(time: number) {
    super(`Return time ${time} is not a valid slot for the selected location and date.`);
  }
}

export class ProductTypeNotFoundError extends OrderError {
  constructor(productTypeId: string) {
    super(`ProductType "${productTypeId}" was not found for order creation.`);
  }
}

export class BundleNotFoundError extends OrderError {
  constructor(bundleId: string) {
    super(`Bundle "${bundleId}" was not found for order creation.`);
  }
}

export type UnavailableItem = { type: 'PRODUCT'; productTypeId: string } | { type: 'BUNDLE'; bundleId: string };

export type ConflictGroup = {
  productTypeId: string;
  availableCount: number;
  requestedCount: number;
  affectedItems: UnavailableItem[];
};

export class OrderItemUnavailableError extends OrderError {
  constructor(
    public readonly unavailableItems: UnavailableItem[],
    public readonly conflictGroups: ConflictGroup[] = [],
  ) {
    super('One or more order items are unavailable for the requested period.');
  }
}
