import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryBus } from '@nestjs/cqrs';
import { FindCredentialsByEmailQuery } from 'src/modules/users/application/queries/find-credentials-by-email/find-credentials-by-email.query';
import { UserCredentials } from 'src/modules/users/application/queries/find-credentials-by-email/find-credentials-by-email.types';
import { CustomerCredentials } from 'src/modules/customer/application/queries/find-customer-credentials/find-customer-credentials.query-handler';
import { FindCustomerCredentialsByEmailQuery } from 'src/modules/customer/application/queries/find-customer-credentials/find-customer-credentials.query';

@Injectable()
export class BcryptService {
  constructor(private readonly queryBus: QueryBus) {}

  async validateUser(email: string, password: string, tenantId: string): Promise<UserCredentials> {
    const user = await this.queryBus.execute<FindCredentialsByEmailQuery, UserCredentials | null>(
      new FindCredentialsByEmailQuery(tenantId, email),
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

  async validateCustomer(email: string, password: string, tenantId: string): Promise<CustomerCredentials> {
    const customer = await this.queryBus.execute<FindCustomerCredentialsByEmailQuery, CustomerCredentials | null>(
      new FindCustomerCredentialsByEmailQuery(email, tenantId),
    );

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
