import { randomUUID } from 'crypto';
import { err, ok, Result } from 'neverthrow';
import { CustomerProfile, CreateCustomerProfileProps } from './customer-profile.entity';
import { CompanyNameRequiredException, InvalidCustomerNameException } from '../exceptions/customer.exceptions';
import {
  CannotReviewNonPendingProfileError,
  CannotSubmitApprovedProfileError,
  CustomerProfileAlreadyExistsError,
  CustomerProfileNotFoundError,
  RejectionReasonRequiredError,
} from '../errors/customer.errors';
import { OnboardingStatus } from '@repo/types';

export interface CreateCustomerProps {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isCompany: boolean | null;
  companyName: string | null;
}

export interface ReconstituteCustomerProps {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isCompany: boolean;
  companyName: string | null;
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
    public readonly isCompany: boolean,
    public readonly companyName: string | null,
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
      props.isCompany ?? false,
      props.companyName?.trim() ?? null,
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
      props.isCompany,
      props.companyName,
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

  submitProfile(props: CreateCustomerProfileProps): Result<void, CustomerProfileAlreadyExistsError> {
    if (this.profile !== null) {
      return err(new CustomerProfileAlreadyExistsError());
    }

    this.profile = CustomerProfile.create(props);
    this.onboardingStatus = OnboardingStatus.PENDING;

    return ok(undefined);
  }

  resubmitProfile(
    props: CreateCustomerProfileProps,
  ): Result<void, CustomerProfileNotFoundError | CannotSubmitApprovedProfileError> {
    if (this.profile === null) {
      return err(new CustomerProfileNotFoundError());
    }

    const profileResubmitResult = this.profile.resubmit();
    if (profileResubmitResult.isErr()) {
      return err(profileResubmitResult.error);
    }

    this.profile = CustomerProfile.create(props);
    this.onboardingStatus = OnboardingStatus.PENDING;

    return ok(undefined);
  }

  approveProfile(
    reviewedById: string,
  ): Result<void, CustomerProfileNotFoundError | CannotReviewNonPendingProfileError> {
    if (this.profile === null) {
      return err(new CustomerProfileNotFoundError());
    }

    const approveResult = this.profile.approve(reviewedById);
    if (approveResult.isErr()) {
      return err(approveResult.error);
    }

    this.onboardingStatus = OnboardingStatus.APPROVED;

    return ok(undefined);
  }

  rejectProfile(
    reviewedById: string,
    reason: string,
  ): Result<void, CustomerProfileNotFoundError | CannotReviewNonPendingProfileError | RejectionReasonRequiredError> {
    if (this.profile === null) {
      return err(new CustomerProfileNotFoundError());
    }

    const rejectResult = this.profile.reject(reviewedById, reason);
    if (rejectResult.isErr()) {
      return err(rejectResult.error);
    }

    this.onboardingStatus = OnboardingStatus.REJECTED;

    return ok(undefined);
  }

  deactivate(): void {
    this.isActive = false;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.isActive = false;
  }
}
