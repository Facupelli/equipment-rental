import { OnboardingStatus } from '@repo/types';

export interface GetCustomerResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  isCompany: boolean;
  companyName: string | null;
  tenantId: string;
  onboardingStatus: OnboardingStatus;
}
