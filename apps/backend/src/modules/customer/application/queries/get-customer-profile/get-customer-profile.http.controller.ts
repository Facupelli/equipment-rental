import { CustomerOnly } from 'src/core/decorators/customer-only.decorator';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetCustomerProfileQuery } from './get-customer-profile.query';
import { GetCustomerProfileResponseDto } from './get-customer-profile.response.dto';
import { GetCustomerProfileResult } from './get-customer-profile.read-model';

@CustomerOnly()
@Controller('customer-profile')
export class GetCustomerProfileHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getCustomerProfile(@CurrentUser() customer: AuthenticatedUser): Promise<GetCustomerProfileResponseDto> {
    const profile: GetCustomerProfileResult | null = await this.queryBus.execute(
      new GetCustomerProfileQuery(customer.id),
    );

    if (!profile) {
      throw new NotFoundException(`Profile for customer ${customer.id} not found`);
    }

    return {
      id: profile.id,
      customerId: profile.customerId,
      status: profile.status,
      submittedAt: profile.submittedAt,
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
      company: profile.company,
      taxId: profile.taxId,
      businessName: profile.businessName,
      bankName: profile.bankName,
      accountNumber: profile.accountNumber,
      contact1Name: profile.contact1Name,
      contact1Relationship: profile.contact1Relationship,
      contact2Name: profile.contact2Name,
      contact2Relationship: profile.contact2Relationship,
      rejectionReason: profile.rejectionReason,
      reviewedAt: profile.reviewedAt,
      reviewedById: profile.reviewedById,
    };
  }
}
