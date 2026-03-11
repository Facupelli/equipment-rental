export class InvalidCustomerNameException extends Error {
  constructor(part: 'first' | 'last') {
    super(`Customer ${part} name cannot be empty.`);
    this.name = 'InvalidCustomerNameException';
  }
}

export class CompanyNameRequiredException extends Error {
  constructor() {
    super('Company name is required when customer is a company.');
    this.name = 'CompanyNameRequiredException';
  }
}

export class RefreshTokenNotFoundException extends Error {
  constructor(tokenId: string) {
    super(`Refresh token '${tokenId}' not found.`);
    this.name = 'RefreshTokenNotFoundException';
  }
}

export class CustomerProfileAlreadyExistsException extends Error {
  constructor() {
    super('Customer profile already exists.');
    this.name = 'CustomerProfileAlreadyExistsException';
  }
}

export class CustomerProfileNotFoundException extends Error {
  constructor() {
    super('Customer profile not found.');
    this.name = 'CustomerProfileNotFoundException';
  }
}

export class CustomerNotFoundException extends Error {
  constructor() {
    super('Customer not found.');
    this.name = 'CustomerNotFoundException';
  }
}

// PROFILE EXCEPTIONS

export class CannotReviewNonPendingProfileException extends Error {
  constructor() {
    super('Cannot review a profile that is not pending.');
    this.name = 'CannotReviewNonPendingProfileException';
  }
}
export class RejectionReasonRequiredException extends Error {
  constructor() {
    super('Rejection reason is required.');
    this.name = 'RejectionReasonRequiredException';
  }
}

export class CannotSubmitApprovedProfileException extends Error {
  constructor() {
    super('Cannot resubmit an approved profile.');
    this.name = 'CannotSubmitApprovedProfileException';
  }
}
