export class InvalidTenantNameException extends Error {
  constructor() {
    super('Tenant name cannot be empty.');
    this.name = 'InvalidTenantNameException';
  }
}

export class InvalidTenantSlugException extends Error {
  constructor(slug: string) {
    super(`The slug "${slug}" is invalid. Only lowercase alphanumeric characters and hyphens are allowed.`);
    this.name = 'InvalidTenantSlugException';
  }
}
