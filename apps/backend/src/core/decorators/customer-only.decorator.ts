import { ActorType } from '@repo/types';

import { AllowActorTypes } from './allowed-actor-types.decorator';

export const CustomerOnly = () => AllowActorTypes(ActorType.CUSTOMER);
