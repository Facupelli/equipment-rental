import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryBus } from '@nestjs/cqrs';
import { FindCustomerCredentialsByEmailQuery } from 'src/modules/customer/public/queries/find-customer-credentials-by-email.query';
import { CustomerCredentialsReadModel } from 'src/modules/customer/public/read-models/customer-credentials.read-model';
import { FindUserCredentialsByEmailQuery } from 'src/modules/users/public/queries/find-user-credentials-by-email.query';
import { UserCredentialsReadModel } from 'src/modules/users/public/read-models/user-credentials.read-model';

@Injectable()
export class BcryptService {
  constructor(private readonly queryBus: QueryBus) {}

  async validateUser(email: string, password: string, tenantId: string): Promise<UserCredentialsReadModel> {
    const user = await this.queryBus.execute<FindUserCredentialsByEmailQuery, UserCredentialsReadModel | null>(
      new FindUserCredentialsByEmailQuery(tenantId, email),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async validateCustomer(email: string, password: string, tenantId: string): Promise<CustomerCredentialsReadModel> {
    const customer = await this.queryBus.execute<
      FindCustomerCredentialsByEmailQuery,
      CustomerCredentialsReadModel | null
    >(new FindCustomerCredentialsByEmailQuery(email, tenantId));

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return customer;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}
