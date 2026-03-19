export class OwnerNotFoundError extends Error {
  constructor() {
    super('Owner not found');
  }
}

export class AssetNotFoundError extends Error {
  constructor() {
    super('Asset not found');
  }
}

export class AssetNotOwnedByOwnerError extends Error {
  constructor() {
    super('Asset does not belong to the specified owner');
  }
}

export class OverlappingContractError extends Error {
  constructor() {
    super('An active contract already exists for this owner and asset scope in the given period');
  }
}

export class ContractNotFoundError extends Error {
  constructor() {
    super('Owner contract not found');
  }
}
