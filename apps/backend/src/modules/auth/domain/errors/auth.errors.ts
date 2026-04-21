import { DomainError } from 'src/core/exceptions/domain.error';

export class AuthError extends DomainError {}

export class InvalidGoogleAuthenticationError extends AuthError {
  constructor(reason: string) {
    super(`Google authentication failed: ${reason}`);
  }
}

export class InvalidGoogleAuthenticationStateError extends AuthError {
  constructor(reason: string) {
    super(`Google authentication state is invalid: ${reason}`);
  }
}

export class InvalidAuthHandoffTokenError extends AuthError {
  constructor() {
    super('Authentication handoff token is invalid.');
  }
}

export class AuthHandoffTokenAlreadyUsedError extends AuthError {
  constructor(tokenId: string) {
    super(`Authentication handoff token '${tokenId}' has already been used.`);
  }
}

export class AuthHandoffTokenExpiredError extends AuthError {
  constructor(tokenId: string) {
    super(`Authentication handoff token '${tokenId}' has expired.`);
  }
}

export class CustomerGoogleIdentityLinkedToUserError extends AuthError {
  constructor(providerSubject: string, userId: string) {
    super(`Google identity '${providerSubject}' is linked to user '${userId}' and cannot authenticate as a customer.`);
  }
}

export class CustomerUnavailableForAuthenticationError extends AuthError {
  constructor(customerId: string, tenantId: string) {
    super(`Customer '${customerId}' in tenant '${tenantId}' is inactive or deleted and cannot authenticate.`);
  }
}
