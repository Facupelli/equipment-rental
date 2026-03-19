export class NoActiveContractForAssetError extends Error {
  constructor(assetId: string, ownerId: string) {
    super(
      `Asset "${assetId}" belongs to owner "${ownerId}" but has no active contract. ` +
        `Define a contract before booking this asset.`,
    );
  }
}

export class InvalidPickupSlotError extends Error {
  constructor(time: number) {
    super(`Pickup time ${time} is not a valid slot for the selected location and date.`);
    this.name = 'InvalidPickupSlotError';
  }
}

export class InvalidReturnSlotError extends Error {
  constructor(time: number) {
    super(`Return time ${time} is not a valid slot for the selected location and date.`);
    this.name = 'InvalidReturnSlotError';
  }
}

// -----------------------------------------------------------------------

export type UnavailableItem = { type: 'PRODUCT'; productTypeId: string } | { type: 'BUNDLE'; bundleId: string };
export type ConflictGroup = {
  productTypeId: string;
  availableCount: number;
  requestedCount: number;
  affectedItems: UnavailableItem[];
};

export class OrderItemUnavailableError extends Error {
  readonly unavailableItems: UnavailableItem[];
  readonly conflictGroups: ConflictGroup[];

  constructor(unavailableItems: UnavailableItem[], conflictGroups: ConflictGroup[] = []) {
    super('One or more order items are unavailable for the requested period.');
    this.name = 'OrderItemUnavailableError';
    this.unavailableItems = unavailableItems;
    this.conflictGroups = conflictGroups;
  }
}
