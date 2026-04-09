export interface GetCustomerProfileReviewResult {
  id: string;
  customerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
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
  rejectionReason: string | null;
  reviewedAt: Date | null;
  reviewedById: string | null;
}
