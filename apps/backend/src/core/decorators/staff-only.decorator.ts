import { ActorType } from '@repo/types';

import { AllowActorTypes } from './allowed-actor-types.decorator';

export const StaffOnly = () => AllowActorTypes(ActorType.USER);
