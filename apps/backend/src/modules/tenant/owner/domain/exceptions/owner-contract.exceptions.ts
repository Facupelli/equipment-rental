export class InvalidShareSplitException extends Error {
  constructor() {
    super('Owner share and rental share must each be greater than 0 and sum to exactly 1.00');
  }
}

export class InvalidContractPeriodException extends Error {
  constructor() {
    super('Contract validUntil must be after validFrom');
  }
}

export class ContractAlreadyInactiveException extends Error {
  constructor() {
    super('Contract is already inactive');
  }
}
