import { DomainError } from 'src/core/exceptions/domain.error';

export class TenantError extends DomainError {}

export class EmailAlreadyInUseError extends TenantError {
  constructor(email?: string) {
    super(email ? `Email '${email}' is already in use` : 'Email is already in use');
  }
}

export class CompanyNameAlreadyInUseError extends TenantError {
  constructor(name?: string) {
    super(name ? `Company name '${name}' is already in use` : 'Company name is already in use');
  }
}

export class TenantNotFoundError extends TenantError {
  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' was not found`);
  }
}
