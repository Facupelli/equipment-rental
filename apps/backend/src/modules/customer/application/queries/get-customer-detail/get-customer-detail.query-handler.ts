import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCustomerDetailQuery } from './get-customer-detail.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { OnboardingStatus } from '@repo/types';
import { GetCustomerDetailResult } from './get-customer-detail.read-model';

interface ActiveRentalRaw {
  order_id: string;
  order_number: number;
  return_date: Date;
}

@QueryHandler(GetCustomerDetailQuery)
export class GetCustomerDetailQueryHandler implements IQueryHandler<GetCustomerDetailQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomerDetailQuery): Promise<GetCustomerDetailResult | null> {
    const { customerId, tenantId } = query;

    const customer = await this.prisma.client.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      return null;
    }

    const activeRentals = await this.prisma.client.$queryRaw<ActiveRentalRaw[]>`
      SELECT
        o.id           AS order_id,
        o.order_number AS order_number,
        upper(aa.period)::timestamptz AS return_date
      FROM orders o
      JOIN LATERAL (
        SELECT period
        FROM asset_assignments
        WHERE order_id = o.id
          AND type = ${Prisma.raw(`'ORDER'::"AssignmentType"`)}
        LIMIT 1
      ) aa ON true
      WHERE
        o.tenant_id::text   = ${tenantId}
        AND o.customer_id::text = ${customerId}
        AND o.status = ${Prisma.raw(`'ACTIVE'::"OrderStatus"`)}
        AND o.deleted_at IS NULL
`;

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isCompany: customer.isCompany,
      companyName: customer.companyName ?? null,
      isActive: customer.isActive,
      onboardingStatus: customer.onboardingStatus as OnboardingStatus,
      createdAt: customer.createdAt,
      totalOrders: customer._count.orders,
      activeRentals: activeRentals.map((r) => ({
        orderId: r.order_id,
        orderNumber: r.order_number,
        returnDate: r.return_date,
      })),
    };
  }
}
