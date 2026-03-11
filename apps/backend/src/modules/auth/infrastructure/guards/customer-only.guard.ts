import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ReqUser } from '../strategies/jwt.strategy';
import { ActorType } from '@repo/types';

@Injectable()
export class CustomerOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user: ReqUser }>().user;

    if (user?.actorType !== ActorType.CUSTOMER) {
      throw new ForbiddenException('This endpoint is restricted to customers.');
    }

    return true;
  }
}
