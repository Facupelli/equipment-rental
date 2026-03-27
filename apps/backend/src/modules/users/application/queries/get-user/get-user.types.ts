export interface GetUserRoleReadModel {
  roleId: string;
  roleName: string;
  locationId: string | null;
}

export interface GetUserReadModel {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  tenantId: string;
  roles: GetUserRoleReadModel[];
}
