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

export class InvalidCustomDomainError extends TenantError {
  constructor(domain: string) {
    super(`Custom domain '${domain}' is invalid`);
  }
}

export class UnsupportedApexCustomDomainError extends TenantError {
  constructor(domain: string) {
    super(`Custom domain '${domain}' must be a subdomain in Phase 1`);
  }
}

export class CustomDomainAlreadyInUseError extends TenantError {
  constructor(domain: string) {
    super(`Custom domain '${domain}' is already in use`);
  }
}

export class TenantAlreadyHasCustomDomainError extends TenantError {
  constructor(tenantId: string, domain?: string | null) {
    super(
      domain
        ? `Tenant '${tenantId}' already has a custom domain '${domain}'`
        : `Tenant '${tenantId}' already has a custom domain`,
    );
  }
}

export class CustomDomainNotFoundError extends TenantError {
  constructor(tenantId: string) {
    super(`No custom domain was found for tenant '${tenantId}'`);
  }
}
