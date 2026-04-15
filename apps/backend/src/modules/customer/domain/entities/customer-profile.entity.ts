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

export enum CustomerProfileLeadSource {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  GOOGLE = 'GOOGLE',
  TIKTOK = 'TIKTOK',
  REFERRAL = 'REFERRAL',
  EVENT = 'EVENT',
  REPEAT_CUSTOMER = 'REPEAT_CUSTOMER',
  OTHER = 'OTHER',
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
  instagram: string | null;
  knowsExistingCustomer: boolean;
  knownCustomerName: string | null;
  heardAboutUs: CustomerProfileLeadSource;
  heardAboutUsOther: string | null;
  contact1Name: string;
  contact1Phone: string;
  contact1Relationship: string;
  contact2Name: string;
  contact2Phone: string;
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
    public fullName: string,
    public phone: string,
    public birthDate: Date,
    public documentNumber: string,
    public identityDocumentPath: string,
    public address: string,
    public city: string,
    public stateRegion: string,
    public country: string,
    public occupation: string,
    public company: string | null,
    public taxId: string | null,
    public businessName: string | null,
    public bankName: string,
    public accountNumber: string,
    public instagram: string | null,
    public knowsExistingCustomer: boolean,
    public knownCustomerName: string | null,
    public heardAboutUs: CustomerProfileLeadSource,
    public heardAboutUsOther: string | null,
    public contact1Name: string,
    public contact1Phone: string,
    public contact1Relationship: string,
    public contact2Name: string,
    public contact2Phone: string,
    public contact2Relationship: string,
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
      props.instagram,
      props.knowsExistingCustomer,
      props.knownCustomerName,
      props.heardAboutUs,
      props.heardAboutUsOther,
      props.contact1Name,
      props.contact1Phone,
      props.contact1Relationship,
      props.contact2Name,
      props.contact2Phone,
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
      props.instagram,
      props.knowsExistingCustomer,
      props.knownCustomerName,
      props.heardAboutUs,
      props.heardAboutUsOther,
      props.contact1Name,
      props.contact1Phone,
      props.contact1Relationship,
      props.contact2Name,
      props.contact2Phone,
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

  resubmitWith(props: CreateCustomerProfileProps): Result<void, CannotSubmitApprovedProfileError> {
    const resubmitResult = this.resubmit();
    if (resubmitResult.isErr()) {
      return err(resubmitResult.error);
    }

    this.fullName = props.fullName;
    this.phone = props.phone;
    this.birthDate = props.birthDate;
    this.documentNumber = props.documentNumber;
    this.identityDocumentPath = props.identityDocumentPath;
    this.address = props.address;
    this.city = props.city;
    this.stateRegion = props.stateRegion;
    this.country = props.country;
    this.occupation = props.occupation;
    this.company = props.company;
    this.taxId = props.taxId;
    this.businessName = props.businessName;
    this.bankName = props.bankName;
    this.accountNumber = props.accountNumber;
    this.instagram = props.instagram;
    this.knowsExistingCustomer = props.knowsExistingCustomer;
    this.knownCustomerName = props.knownCustomerName;
    this.heardAboutUs = props.heardAboutUs;
    this.heardAboutUsOther = props.heardAboutUsOther;
    this.contact1Name = props.contact1Name;
    this.contact1Phone = props.contact1Phone;
    this.contact1Relationship = props.contact1Relationship;
    this.contact2Name = props.contact2Name;
    this.contact2Phone = props.contact2Phone;
    this.contact2Relationship = props.contact2Relationship;

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
