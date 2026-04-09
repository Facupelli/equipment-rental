export interface PendingCustomerProfileListItemReadModel {
  id: string;
  customerName: string;
  submittedAt: Date;
  status: 'PENDING';
}

export type GetPendingCustomerProfilesResult = PendingCustomerProfileListItemReadModel[];
