export interface GetCustomerProfileResult {
  id: string;
  status: string;
  submittedAt: Date;
  fullName: string;
  phone: string;
  birthDate: Date;
  documentNumber: string;
  address: string;
  city: string;
  stateRegion: string;
  country: string;
  occupation: string;
  company: string | null;
  taxId: string | null;
  bankName: string;
  accountNumber: string;
  rejectionReason: string | null;
}
