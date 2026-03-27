import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetCustomerQuery } from './get-customer.query';
import { OnboardingStatus } from '@repo/types';
import { GetCustomerResult } from './get-customer.read-model';

@QueryHandler(GetCustomerQuery)
export class GetCustomerQueryHandler implements IQueryHandler<GetCustomerQuery, GetCustomerResult | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomerQuery): Promise<GetCustomerResult | null> {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: query.customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isCompany: true,
        companyName: true,
        tenantId: true,
        onboardingStatus: true,
      },
    });

    if (!customer) {
      return null;
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: customer.firstName + ' ' + customer.lastName,
      isActive: customer.isActive,
      isCompany: customer.isCompany,
      companyName: customer.companyName,
      tenantId: customer.tenantId,
      onboardingStatus: customer.onboardingStatus as OnboardingStatus,
    };
  }
}
