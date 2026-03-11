import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCustomersQuery } from './get-customers.query';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { CustomerResponseDto, PaginatedDto } from '@repo/schemas';
import { OnboardingStatus } from '@repo/types';

@QueryHandler(GetCustomersQuery)
export class GetCustomersQueryHandler implements IQueryHandler<GetCustomersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomersQuery): Promise<PaginatedDto<CustomerResponseDto>> {
    const offset = (query.page - 1) * query.limit;

    const where: Prisma.CustomerWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.onboardingStatus && { onboardingStatus: query.onboardingStatus }),
      ...(query.isActive !== null && { isActive: query.isActive }),
      ...(query.isCompany !== null && { isCompany: query.isCompany }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { companyName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.client.$transaction([
      this.prisma.client.customer.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isCompany: true,
          companyName: true,
          isActive: true,
          onboardingStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: query.limit,
      }),
      this.prisma.client.customer.count({ where }),
    ]);

    const data: CustomerResponseDto[] = rows.map((row) => ({
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      isCompany: row.isCompany,
      companyName: row.companyName,
      isActive: row.isActive,
      onboardingStatus: row.onboardingStatus as OnboardingStatus,
      createdAt: row.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
