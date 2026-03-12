import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetCustomerProfileQuery } from './get-customer-profile.query';
import { CustomerProfileResponseDto } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';

@QueryHandler(GetCustomerProfileQuery)
export class GetCustomerProfileQueryHandler implements IQueryHandler<GetCustomerProfileQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomerProfileQuery): Promise<CustomerProfileResponseDto> {
    const { customerId } = query;

    const profile = await this.prisma.client.customerProfile.findUnique({
      where: { customerId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile for customer ${customerId} not found`);
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
