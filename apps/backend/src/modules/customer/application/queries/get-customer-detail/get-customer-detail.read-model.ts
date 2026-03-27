import { OnboardingStatus } from '@repo/types';

export interface ActiveRentalReadModel {
  orderId: string;
  orderNumber: number;
  returnDate: Date;
}

export interface GetCustomerDetailResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isCompany: boolean;
  companyName: string | null;
  isActive: boolean;
  onboardingStatus: OnboardingStatus;
  createdAt: Date;
  totalOrders: number;
  activeRentals: ActiveRentalReadModel[];
}
