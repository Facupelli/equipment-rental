import { randomUUID } from 'crypto';
import { err, ok, Result } from 'neverthrow';
import {
  CannotReviewNonPendingProfileError,
  CannotSubmitApprovedProfileError,
  RejectionReasonRequiredError,
} from '../errors/customer.errors';

export enum ProfileSubmissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CreateCustomerProfileProps {
  customerId: string;
  fullName: string;
  phone: string;
  birthDate: Date;
  documentNumber: string;
  identityDocumentPath: string;
  address: string;
  city: string;
  stateRegion: string;
  country: string;
  occupation: string;
  company: string | null;
  taxId: string | null;
  businessName: string | null;
  bankName: string;
  accountNumber: string;
  contact1Name: string;
  contact1Relationship: string;
  contact2Name: string;
  contact2Relationship: string;
}

export interface ReconstituteCustomerProfileProps extends CreateCustomerProfileProps {
  id: string;
  status: ProfileSubmissionStatus;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  reviewedById: string | null;
}

export class CustomerProfile {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    private status: ProfileSubmissionStatus,
    public readonly fullName: string,
    public readonly phone: string,
    public readonly birthDate: Date,
    public readonly documentNumber: string,
    public readonly identityDocumentPath: string,
    public readonly address: string,
    public readonly city: string,
    public readonly stateRegion: string,
    public readonly country: string,
    public readonly occupation: string,
    public readonly company: string | null,
    public readonly taxId: string | null,
    public readonly businessName: string | null,
    public readonly bankName: string,
    public readonly accountNumber: string,
    public readonly contact1Name: string,
    public readonly contact1Relationship: string,
    public readonly contact2Name: string,
    public readonly contact2Relationship: string,
    private rejectionReason: string | null,
    private reviewedAt: Date | null,
    private reviewedById: string | null,
  ) {}

  // --- Factories ---

  static create(props: CreateCustomerProfileProps): CustomerProfile {
    return new CustomerProfile(
      randomUUID(),
      props.customerId,
      ProfileSubmissionStatus.PENDING,
      props.fullName,
      props.phone,
      props.birthDate,
      props.documentNumber,
      props.identityDocumentPath,
      props.address,
      props.city,
      props.stateRegion,
      props.country,
      props.occupation,
      props.company,
      props.taxId,
      props.businessName,
      props.bankName,
      props.accountNumber,
      props.contact1Name,
      props.contact1Relationship,
      props.contact2Name,
      props.contact2Relationship,
      null,
      null,
      null,
    );
  }

  static reconstitute(props: ReconstituteCustomerProfileProps): CustomerProfile {
    return new CustomerProfile(
      props.id,
      props.customerId,
      props.status,
      props.fullName,
      props.phone,
      props.birthDate,
      props.documentNumber,
      props.identityDocumentPath,
      props.address,
      props.city,
      props.stateRegion,
      props.country,
      props.occupation,
      props.company,
      props.taxId,
      props.businessName,
      props.bankName,
      props.accountNumber,
      props.contact1Name,
      props.contact1Relationship,
      props.contact2Name,
      props.contact2Relationship,
      props.rejectionReason,
      props.reviewedAt,
      props.reviewedById,
    );
  }

  // --- Queries ---

  getStatus(): ProfileSubmissionStatus {
    return this.status;
  }

  getRejectionReason(): string | null {
    return this.rejectionReason;
  }

  getReviewedAt(): Date | null {
    return this.reviewedAt;
  }

  getReviewedById(): string | null {
    return this.reviewedById;
  }

  isPending(): boolean {
    return this.status === ProfileSubmissionStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === ProfileSubmissionStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === ProfileSubmissionStatus.REJECTED;
  }

  // --- Commands ---

  resubmit(): Result<void, CannotSubmitApprovedProfileError> {
    if (this.isApproved()) {
      return err(new CannotSubmitApprovedProfileError());
    }

    this.status = ProfileSubmissionStatus.PENDING;
    this.rejectionReason = null;
    this.reviewedAt = null;
    this.reviewedById = null;

    return ok(undefined);
  }

  approve(reviewedById: string): Result<void, CannotReviewNonPendingProfileError> {
    if (!this.isPending()) {
      return err(new CannotReviewNonPendingProfileError());
    }

    this.status = ProfileSubmissionStatus.APPROVED;
    this.reviewedById = reviewedById;
    this.reviewedAt = new Date();

    return ok(undefined);
  }

  reject(
    reviewedById: string,
    reason: string,
  ): Result<void, CannotReviewNonPendingProfileError | RejectionReasonRequiredError> {
    if (!this.isPending()) {
      return err(new CannotReviewNonPendingProfileError());
    }

    if (!reason || reason.trim().length === 0) {
      return err(new RejectionReasonRequiredError());
    }

    this.status = ProfileSubmissionStatus.REJECTED;
    this.rejectionReason = reason.trim();
    this.reviewedById = reviewedById;
    this.reviewedAt = new Date();

    return ok(undefined);
  }
}
