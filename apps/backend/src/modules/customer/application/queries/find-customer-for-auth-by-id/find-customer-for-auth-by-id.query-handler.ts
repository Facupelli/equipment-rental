import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';

import { FindCustomerForAuthByIdQuery } from '../../../public/queries/find-customer-for-auth-by-id.query';
import { CustomerForAuthReadModel } from '../../../public/read-models/customer-for-auth.read-model';

@QueryHandler(FindCustomerForAuthByIdQuery)
export class FindCustomerForAuthByIdQueryHandler implements IQueryHandler<
  FindCustomerForAuthByIdQuery,
  CustomerForAuthReadModel | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindCustomerForAuthByIdQuery): Promise<CustomerForAuthReadModel | null> {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: query.customerId },
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
