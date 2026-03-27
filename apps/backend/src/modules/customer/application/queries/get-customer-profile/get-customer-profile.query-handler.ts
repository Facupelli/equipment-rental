import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCustomerProfileQuery } from './get-customer-profile.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetCustomerProfileResult } from './get-customer-profile.read-model';

@QueryHandler(GetCustomerProfileQuery)
export class GetCustomerProfileQueryHandler implements IQueryHandler<GetCustomerProfileQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomerProfileQuery): Promise<GetCustomerProfileResult | null> {
    const { customerId } = query;

    const profile = await this.prisma.client.customerProfile.findUnique({
      where: { customerId },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      status: profile.status,
      submittedAt: profile.createdAt,

      fullName: profile.fullName,
      phone: profile.phone,
      birthDate: profile.birthDate,
      documentNumber: profile.documentNumber,

      address: profile.address,
      city: profile.city,
      stateRegion: profile.stateRegion,
      country: profile.country,

      occupation: profile.occupation,
      company: profile.company ?? null,
      taxId: profile.taxId ?? null,

      bankName: profile.bankName,
      accountNumber: profile.accountNumber,

      rejectionReason: profile.rejectionReason ?? null,
    };
  }
}
