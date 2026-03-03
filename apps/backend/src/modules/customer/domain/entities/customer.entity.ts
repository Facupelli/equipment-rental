import { randomUUID } from 'crypto';
import { InvalidCustomerNameException, CompanyNameRequiredException } from '../exceptions/customer.exceptions';

export interface CreateCustomerProps {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isCompany?: boolean;
  companyName?: string;
  taxId?: string;
}

export interface ReconstituteCustomerProps {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isCompany: boolean;
  companyName: string | null;
  taxId: string | null;
  isActive: boolean;
  deletedAt: Date | null;
}

export class Customer {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    private readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string | null,
    public readonly isCompany: boolean,
    public readonly companyName: string | null,
    public readonly taxId: string | null,
    private isActive: boolean,
    private deletedAt: Date | null,
  ) {}

  static create(props: CreateCustomerProps): Customer {
    if (!props.firstName || props.firstName.trim().length === 0) {
      throw new InvalidCustomerNameException('first');
    }
    if (!props.lastName || props.lastName.trim().length === 0) {
      throw new InvalidCustomerNameException('last');
    }
    if (props.isCompany && (!props.companyName || props.companyName.trim().length === 0)) {
      throw new CompanyNameRequiredException();
    }
    return new Customer(
      randomUUID(),
      props.tenantId,
      props.email,
      props.passwordHash,
      props.firstName.trim(),
      props.lastName.trim(),
      props.phone?.trim() ?? null,
      props.isCompany ?? false,
      props.companyName?.trim() ?? null,
      props.taxId?.trim() ?? null,
      true,
      null,
    );
  }

  static reconstitute(props: ReconstituteCustomerProps): Customer {
    return new Customer(
      props.id,
      props.tenantId,
      props.email,
      props.passwordHash,
      props.firstName,
      props.lastName,
      props.phone,
      props.isCompany,
      props.companyName,
      props.taxId,
      props.isActive,
      props.deletedAt,
    );
  }

  get active(): boolean {
    return this.isActive;
  }

  get deleted(): boolean {
    return this.deletedAt !== null;
  }

  get deletedOn(): Date | null {
    return this.deletedAt;
  }

  get currentPasswordHash(): string {
    return this.passwordHash;
  }

  deactivate(): void {
    this.isActive = false;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.isActive = false;
  }
}
