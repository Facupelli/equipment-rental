import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrderStatus } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';
import { GetPendingReviewOrdersResponseDto } from './get-pending-review-orders.response.dto';
import { GetPendingReviewOrdersQuery } from './get-pending-review-orders.query';

@QueryHandler(GetPendingReviewOrdersQuery)
export class GetPendingReviewOrdersQueryHandler implements IQueryHandler<
  GetPendingReviewOrdersQuery,
  GetPendingReviewOrdersResponseDto
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPendingReviewOrdersQuery): Promise<GetPendingReviewOrdersResponseDto> {
    const offset = (query.page - 1) * query.limit;
    const where = {
      tenantId: query.tenantId,
      deletedAt: null,
      status: OrderStatus.PENDING_REVIEW,
      ...(query.locationId ? { locationId: query.locationId } : {}),
    };

    const [rows, total] = await this.prisma.client.$transaction([
      this.prisma.client.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          periodStart: true,
          periodEnd: true,
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              isCompany: true,
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: query.limit,
      }),
      this.prisma.client.order.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        number: row.orderNumber,
        status: row.status as OrderStatus,
        createdAt: row.createdAt,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        customer: row.customer
          ? {
              id: row.customer.id,
              displayName:
                row.customer.isCompany && row.customer.companyName
                  ? row.customer.companyName
                  : `${row.customer.firstName} ${row.customer.lastName}`.trim(),
              isCompany: row.customer.isCompany,
            }
          : null,
        location: row.location,
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }
}
