import { DomainError } from 'src/core/exceptions/domain.error';

export class OwnerContractError extends DomainError {}

export class OwnerNotFoundError extends OwnerContractError {
  constructor(ownerId?: string) {
    super(ownerId ? `Owner '${ownerId}' was not found` : 'Owner was not found');
  }
}

export class AssetNotFoundError extends OwnerContractError {
  constructor(assetId?: string) {
    super(assetId ? `Asset '${assetId}' was not found` : 'Asset was not found');
  }
}

export class AssetNotOwnedByOwnerError extends OwnerContractError {
  constructor(ownerId?: string, assetId?: string) {
    super(
      ownerId && assetId
        ? `Asset '${assetId}' does not belong to owner '${ownerId}'`
        : 'Asset does not belong to the specified owner',
    );
  }
}

export class OverlappingContractError extends OwnerContractError {
  constructor(ownerId?: string, assetId?: string | null) {
    super(
      ownerId
        ? `An overlapping active contract already exists for owner '${ownerId}'${assetId ? ` and asset '${assetId}'` : ''}`
        : 'An overlapping active contract already exists for this owner and asset scope in the given period',
    );
  }
}

export class ContractNotFoundError extends OwnerContractError {
  constructor(contractId?: string) {
    super(contractId ? `Owner contract '${contractId}' was not found` : 'Owner contract was not found');
  }
}
