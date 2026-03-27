import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ActorType } from '@repo/types';
import { AuthenticatedUser } from '../../public/authenticated-user';

@Injectable()
export class CustomerOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user;

    if (user?.actorType !== ActorType.CUSTOMER) {
      throw new ForbiddenException('This endpoint is restricted to customers.');
    }

    return true;
  }
}
