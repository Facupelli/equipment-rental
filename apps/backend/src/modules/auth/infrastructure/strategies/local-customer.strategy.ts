import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { BcryptService } from '../../application/bcript.service';
import { Request } from 'express';
import { ActorType } from '@repo/types';

export interface CustomerLocalUser {
  id: string;
  email: string;
  tenantId: string;
  actorType: ActorType;
}

@Injectable()
export class LocalCustomerStrategy extends PassportStrategy(Strategy, 'local-customer') {
  constructor(private readonly bcryptService: BcryptService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, email: string, password: string): Promise<CustomerLocalUser> {
    const tenantId = req.body.tenantId as string | undefined;

    if (!tenantId) {
      throw new UnauthorizedException('tenantId is required.');
    }

    const customer = await this.bcryptService.validateCustomer(email, password, tenantId);

    return {
      id: customer.id,
      email: customer.email,
      tenantId: customer.tenantId,
      actorType: ActorType.CUSTOMER,
    };
  }
}
