import { CustomerStatus } from '@repo/types';
import { randomUUID } from 'node:crypto';

export interface CustomerProps {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCustomerProps = Omit<CustomerProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export class Customer {
  private readonly _id: string;
  private readonly _tenantId: string;
  private _name: string;
  private _email: string;
  private _phone: string | null;
  private _status: CustomerStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // TODO: Add creditLimit: Money for credit-based booking restrictions (KYC phase)
  // TODO: Add kycVerifiedAt: Date | null once KYC flow is implemented

  private constructor(props: CustomerProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._name = props.name;
    this._email = props.email;
    this._phone = props.phone;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateCustomerProps): Customer {
    const now = new Date();
    return new Customer({
      id: randomUUID(),
      ...props,
      status: CustomerStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  // ── Behavior ───────────────────────────────────────────────────────────────
  public updateDetails(name: string, email: string, phone: string | null): void {
    this._name = name;
    this._email = email;
    this._phone = phone;
    this._updatedAt = new Date();
  }

  public blacklist(): void {
    if (this._status === 'BLACKLISTED') {
      return;
    }
    this._status = CustomerStatus.BLACKLISTED;
    this._updatedAt = new Date();
  }

  public suspend(): void {
    this.assertStatus(CustomerStatus.ACTIVE, CustomerStatus.PENDING_KYC);
    this._status = CustomerStatus.SUSPENDED;
    this._updatedAt = new Date();
  }

  public reinstate(): void {
    this.assertStatus(CustomerStatus.SUSPENDED);
    this._status = CustomerStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._status = CustomerStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * Whether this customer is permitted to create new bookings.
   * PENDING_KYC customers are allowed by default — tenant-level KYC
   * restrictions will be enforced in a future iteration.
   */
  get canBook(): boolean {
    return this._status === 'ACTIVE' || this._status === 'PENDING_KYC';
  }

  // ── Getters ────────────────────────────────────────────────────────────────
  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get name(): string {
    return this._name;
  }
  get email(): string {
    return this._email;
  }
  get phone(): string | null {
    return this._phone;
  }
  get status(): CustomerStatus {
    return this._status;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  private assertStatus(...allowed: CustomerStatus[]): void {
    if (!allowed.includes(this._status)) {
      throw new Error(
        `Operation not allowed for customer with status "${this._status}". ` +
          `Allowed statuses: ${allowed.join(', ')}.`,
      );
    }
  }
}
