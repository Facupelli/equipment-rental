import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActorType } from '@repo/types';

import { ALLOWED_ACTOR_TYPES_KEY } from 'src/core/decorators/allowed-actor-types.decorator';

import { AuthenticatedUser } from '../../public/authenticated-user';

@Injectable()
export class ActorTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedActorTypes = this.reflector.getAllAndOverride<ActorType[]>(ALLOWED_ACTOR_TYPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedActorTypes || allowedActorTypes.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;

    if (!user || !allowedActorTypes.includes(user.actorType)) {
      throw new ForbiddenException(
        allowedActorTypes.length === 1 && allowedActorTypes[0] === ActorType.CUSTOMER
          ? 'This endpoint is restricted to customers.'
          : 'This endpoint is restricted to staff users.',
      );
    }

    return true;
  }
}
