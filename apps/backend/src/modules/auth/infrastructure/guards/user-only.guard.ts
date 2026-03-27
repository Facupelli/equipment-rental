import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ActorType } from '@repo/types';
import { AuthenticatedUser } from '../../public/authenticated-user';

@Injectable()
export class UserOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user;

    if (user?.actorType !== ActorType.USER) {
      throw new ForbiddenException('This endpoint is restricted to admin users.');
    }

    return true;
  }
}
