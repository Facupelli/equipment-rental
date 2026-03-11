import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { FindCustomerCredentialsByEmailQuery } from './find-customer-credentials.query';

export interface CustomerCredentials {
  id: string;
  email: string;
  tenantId: string;
  passwordHash: string;
}

@QueryHandler(FindCustomerCredentialsByEmailQuery)
export class FindCustomerCredentialsByEmailQueryHandler implements IQueryHandler<
  FindCustomerCredentialsByEmailQuery,
  CustomerCredentials | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindCustomerCredentialsByEmailQuery): Promise<CustomerCredentials | null> {
    const customer = await this.prisma.client.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: query.tenantId,
          email: query.email,
        },
      },
      select: {
        id: true,
        email: true,
        tenantId: true,
        passwordHash: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!customer || !customer.isActive || customer.deletedAt !== null) {
      return null;
    }

    return {
      id: customer.id,
      email: customer.email,
      tenantId: customer.tenantId,
      passwordHash: customer.passwordHash,
    };
  }
}
