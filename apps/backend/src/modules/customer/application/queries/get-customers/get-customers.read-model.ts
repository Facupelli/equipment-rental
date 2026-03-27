import { OnboardingStatus } from '@repo/types';

export interface CustomerListItemReadModel {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isCompany: boolean;
  companyName: string | null;
  isActive: boolean;
  onboardingStatus: OnboardingStatus;
  createdAt: Date;
}

export interface GetCustomersResult {
  data: CustomerListItemReadModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
