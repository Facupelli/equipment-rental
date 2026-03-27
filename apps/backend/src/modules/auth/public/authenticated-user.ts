import { ActorType } from '@repo/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  actorType: ActorType;
}
