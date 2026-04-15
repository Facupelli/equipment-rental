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
      customerId: profile.customerId,
      status: profile.status,
      submittedAt: profile.createdAt,

      fullName: profile.fullName,
      phone: profile.phone,
      birthDate: profile.birthDate,
      documentNumber: profile.documentNumber,
      identityDocumentPath: profile.identityDocumentPath,

      address: profile.address,
      city: profile.city,
      stateRegion: profile.stateRegion,
      country: profile.country,

      occupation: profile.occupation,
      company: profile.company ?? null,
      taxId: profile.taxId ?? null,
      businessName: profile.businessName ?? null,

      bankName: profile.bankName,
      accountNumber: profile.accountNumber,
      instagram: profile.instagram ?? null,
      knowsExistingCustomer: profile.knowsExistingCustomer,
      knownCustomerName: profile.knownCustomerName ?? null,
      heardAboutUs: profile.heardAboutUs,
      heardAboutUsOther: profile.heardAboutUsOther ?? null,

      contact1Name: profile.contact1Name,
      contact1Phone: profile.contact1Phone,
      contact1Relationship: profile.contact1Relationship,
      contact2Name: profile.contact2Name,
      contact2Phone: profile.contact2Phone,
      contact2Relationship: profile.contact2Relationship,

      rejectionReason: profile.rejectionReason ?? null,
      reviewedAt: profile.reviewedAt ?? null,
      reviewedById: profile.reviewedById ?? null,
    };
  }
}
