import { DomainError } from 'src/core/exceptions/domain.error';

export class CustomerError extends DomainError {}

export class CustomerProfileAlreadyExistsError extends CustomerError {
  constructor() {
    super('Customer profile already exists.');
  }
}

export class CustomerProfileNotFoundError extends CustomerError {
  constructor() {
    super('Customer profile not found.');
  }
}

export class CustomerNotFoundError extends CustomerError {
  constructor() {
    super('Customer not found.');
  }
}

export class CannotReviewNonPendingProfileError extends CustomerError {
  constructor() {
    super('Cannot review a profile that is not pending.');
  }
}

export class RejectionReasonRequiredError extends CustomerError {
  constructor() {
    super('Rejection reason is required.');
  }
}

export class CannotSubmitApprovedProfileError extends CustomerError {
  constructor() {
    super('Cannot resubmit an approved profile.');
  }
}
