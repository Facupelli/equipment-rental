export interface UserCredentialsReadModel {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  roles: Array<{
    id: string;
  }>;
}
