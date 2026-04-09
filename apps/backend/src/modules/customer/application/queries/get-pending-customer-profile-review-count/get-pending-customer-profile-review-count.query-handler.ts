import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetPendingCustomerProfileReviewCountQuery } from './get-pending-customer-profile-review-count.query';
import { GetPendingCustomerProfileReviewCountResult } from './get-pending-customer-profile-review-count.read-model';

@QueryHandler(GetPendingCustomerProfileReviewCountQuery)
export class GetPendingCustomerProfileReviewCountQueryHandler implements IQueryHandler<
  GetPendingCustomerProfileReviewCountQuery,
  GetPendingCustomerProfileReviewCountResult
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPendingCustomerProfileReviewCountQuery): Promise<GetPendingCustomerProfileReviewCountResult> {
    const count = await this.prisma.client.customerProfile.count({
      where: {
        status: 'PENDING',
        customer: {
          tenantId: query.tenantId,
          deletedAt: null,
        },
      },
    });

    return { count };
  }
}
