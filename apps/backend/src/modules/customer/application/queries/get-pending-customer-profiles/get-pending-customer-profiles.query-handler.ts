import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetPendingCustomerProfilesQuery } from './get-pending-customer-profiles.query';
import { GetPendingCustomerProfilesResult } from './get-pending-customer-profiles.read-model';

@QueryHandler(GetPendingCustomerProfilesQuery)
export class GetPendingCustomerProfilesQueryHandler implements IQueryHandler<
  GetPendingCustomerProfilesQuery,
  GetPendingCustomerProfilesResult
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPendingCustomerProfilesQuery): Promise<GetPendingCustomerProfilesResult> {
    const rows = await this.prisma.client.customerProfile.findMany({
      where: {
        status: 'PENDING',
        customer: {
          tenantId: query.tenantId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      customerName: `${row.customer.firstName} ${row.customer.lastName}`.trim(),
      submittedAt: row.createdAt,
      status: 'PENDING',
    }));
  }
}
