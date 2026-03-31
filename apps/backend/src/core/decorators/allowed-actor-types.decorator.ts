import { SetMetadata } from '@nestjs/common';
import { ActorType } from '@repo/types';

export const ALLOWED_ACTOR_TYPES_KEY = 'allowedActorTypes';

export const AllowActorTypes = (...actorTypes: ActorType[]) => SetMetadata(ALLOWED_ACTOR_TYPES_KEY, actorTypes);
