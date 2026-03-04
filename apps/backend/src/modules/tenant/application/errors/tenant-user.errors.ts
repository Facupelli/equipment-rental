export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Email already in use');
    this.name = 'EmailAlreadyInUseError';
  }
}

export class CompanyNameAlreadyInUseError extends Error {
  constructor() {
    super('Company name already in use');
    this.name = 'CompanyNameAlreadyInUseError';
  }
}

export type TenantUserError = EmailAlreadyInUseError | CompanyNameAlreadyInUseError;
