import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';

import { FindCustomerForAuthByEmailQuery } from '../../../public/queries/find-customer-for-auth-by-email.query';
import { CustomerForAuthReadModel } from '../../../public/read-models/customer-for-auth.read-model';

@QueryHandler(FindCustomerForAuthByEmailQuery)
export class FindCustomerForAuthByEmailQueryHandler implements IQueryHandler<
  FindCustomerForAuthByEmailQuery,
  CustomerForAuthReadModel | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindCustomerForAuthByEmailQuery): Promise<CustomerForAuthReadModel | null> {
    const customer = await this.prisma.client.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: query.tenantId,
          email: query.email,
        },
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!customer) {
      return null;
    }

    return {
      id: customer.id,
      tenantId: customer.tenantId,
      email: customer.email,
      isActive: customer.isActive,
      deletedAt: customer.deletedAt,
    };
  }
}
