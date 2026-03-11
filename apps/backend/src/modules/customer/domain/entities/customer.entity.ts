import { randomUUID } from 'crypto';
import { CustomerProfile, CreateCustomerProfileProps } from './customer-profile.entity';
import {
  CompanyNameRequiredException,
  CustomerProfileAlreadyExistsException,
  CustomerProfileNotFoundException,
  InvalidCustomerNameException,
} from '../exceptions/customer.exceptions';
import { OnboardingStatus } from '@repo/types';

export interface CreateCustomerProps {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isCompany: boolean | null;
  companyName: string | null;
  taxId: string | null;
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
  onboardingStatus: OnboardingStatus;
  profile: CustomerProfile | null;
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
    private onboardingStatus: OnboardingStatus,
    private profile: CustomerProfile | null,
  ) {}

  // --- Factories ---

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
      OnboardingStatus.NOT_STARTED,
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
      props.onboardingStatus,
      props.profile,
    );
  }

  // --- Queries ---

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

  get currentOnboardingStatus(): OnboardingStatus {
    return this.onboardingStatus;
  }

  getProfile(): CustomerProfile | null {
    return this.profile;
  }

  // --- Commands ---

  submitProfile(props: CreateCustomerProfileProps): void {
    if (this.profile !== null) {
      throw new CustomerProfileAlreadyExistsException();
    }
    this.profile = CustomerProfile.create(props);
    this.onboardingStatus = OnboardingStatus.PENDING;
  }

  resubmitProfile(props: CreateCustomerProfileProps): void {
    if (this.profile === null) {
      throw new CustomerProfileNotFoundException();
    }
    this.profile = CustomerProfile.create(props);
    this.onboardingStatus = OnboardingStatus.PENDING;
  }

  approveProfile(reviewedById: string): void {
    if (this.profile === null) {
      throw new CustomerProfileNotFoundException();
    }
    this.profile.approve(reviewedById);
    this.onboardingStatus = OnboardingStatus.APPROVED;
  }

  rejectProfile(reviewedById: string, reason: string): void {
    if (this.profile === null) {
      throw new CustomerProfileNotFoundException();
    }
    this.profile.reject(reviewedById, reason);
    this.onboardingStatus = OnboardingStatus.REJECTED;
  }

  deactivate(): void {
    this.isActive = false;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.isActive = false;
  }
}
