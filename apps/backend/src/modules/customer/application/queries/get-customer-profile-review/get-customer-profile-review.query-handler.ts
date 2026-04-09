import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetCustomerProfileReviewQuery } from './get-customer-profile-review.query';
import { GetCustomerProfileReviewResult } from './get-customer-profile-review.read-model';

@QueryHandler(GetCustomerProfileReviewQuery)
export class GetCustomerProfileReviewQueryHandler implements IQueryHandler<
  GetCustomerProfileReviewQuery,
  GetCustomerProfileReviewResult | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomerProfileReviewQuery): Promise<GetCustomerProfileReviewResult | null> {
    const profile = await this.prisma.client.customerProfile.findFirst({
      where: {
        id: query.customerProfileId,
        customer: {
          tenantId: query.tenantId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        customerId: true,
        status: true,
        createdAt: true,
        fullName: true,
        phone: true,
        birthDate: true,
        documentNumber: true,
        identityDocumentPath: true,
        address: true,
        city: true,
        stateRegion: true,
        country: true,
        occupation: true,
        company: true,
        taxId: true,
        businessName: true,
        bankName: true,
        accountNumber: true,
        contact1Name: true,
        contact1Relationship: true,
        contact2Name: true,
        contact2Relationship: true,
        rejectionReason: true,
        reviewedAt: true,
        reviewedById: true,
      },
    });

    if (!profile) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...restOfProfile } = profile;

    return {
      ...restOfProfile,
      submittedAt: profile.createdAt,
    };
  }
}
