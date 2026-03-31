import { Permission } from '@repo/types';

export interface UserPermissionsReadModel {
  userId: string;
  permissions: Permission[];
}
