import { applyDecorators } from '@nestjs/common';
import { Permission } from '@repo/types';

import { RequirePermissions } from './required-permissions.decorator';
import { StaffOnly } from './staff-only.decorator';

export const StaffRoute = (...permissions: Permission[]) =>
  applyDecorators(StaffOnly(), RequirePermissions(...permissions));
