export interface CustomerForAuthReadModel {
  id: string;
  tenantId: string;
  email: string;
  isActive: boolean;
  deletedAt: Date | null;
}
