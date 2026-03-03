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
