import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ReqUser } from '../strategies/jwt.strategy';
import { ActorType } from '@repo/types';

@Injectable()
export class UserOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user: ReqUser }>().user;

    if (user?.actorType !== ActorType.USER) {
      throw new ForbiddenException('This endpoint is restricted to admin users.');
    }

    return true;
  }
}
