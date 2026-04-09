import { Module } from '@nestjs/common';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { FindCustomerCredentialsByEmailQueryHandler } from './application/queries/find-customer-credentials/find-customer-credentials.query-handler';
import { GetCustomersQueryHandler } from './application/queries/get-customers/get-customers.query-handler';
import { GetCustomersHttpController } from './application/queries/get-customers/get-customers.http.controller';
import { SubmitCustomerProfileService } from './application/commands/submit-customer-profile/submit-customer-profile.service';
import { SubmitCustomerProfileHttpController } from './application/commands/submit-customer-profile/submit-customer-profile.http.controller';
import { ResubmitCustomerProfileService } from './application/commands/resubmit-customer-profile/resubmit-customer-profile.service';
import { ResubmitCustomerProfileHttpController } from './application/commands/resubmit-customer-profile/resubmit-customer-profile.http.controller';
import { CustomerApplicationService } from './application/customer.application-service';
import { CustomerPublicApi } from './customer.public-api';
import { GetCustomerDetailQueryHandler } from './application/queries/get-customer-detail/get-customer-detail.query-handler';
import { GetCustomerDetailHttpController } from './application/queries/get-customer-detail/get-customer-detail.http.controller';
import { GetCustomerProfileQueryHandler } from './application/queries/get-customer-profile/get-customer-profile.query-handler';
import { GetCustomerProfileHttpController } from './application/queries/get-customer-profile/get-customer-profile.http.controller';
import { GetCustomerQueryHandler } from './application/queries/get-customer/get-customer.query-handler';
import { GetCustomerHttpController } from './application/queries/get-customer/get-customer.http.controller';
import { GetPendingCustomerProfilesQueryHandler } from './application/queries/get-pending-customer-profiles/get-pending-customer-profiles.query-handler';
import { GetPendingCustomerProfilesHttpController } from './application/queries/get-pending-customer-profiles/get-pending-customer-profiles.http.controller';
import { GetCustomerProfileReviewQueryHandler } from './application/queries/get-customer-profile-review/get-customer-profile-review.query-handler';
import { GetCustomerProfileReviewHttpController } from './application/queries/get-customer-profile-review/get-customer-profile-review.http.controller';
import { GetPendingCustomerProfileReviewCountQueryHandler } from './application/queries/get-pending-customer-profile-review-count/get-pending-customer-profile-review-count.query-handler';
import { GetPendingCustomerProfileReviewCountHttpController } from './application/queries/get-pending-customer-profile-review-count/get-pending-customer-profile-review-count.http.controller';
import { ApproveCustomerProfileService } from './application/commands/approve-customer-profile/approve-customer-profile.service';
import { ApproveCustomerProfileHttpController } from './application/commands/approve-customer-profile/approve-customer-profile.http.controller';
import { RejectCustomerProfileService } from './application/commands/reject-customer-profile/reject-customer-profile.service';
import { RejectCustomerProfileHttpController } from './application/commands/reject-customer-profile/reject-customer-profile.http.controller';

const commandServices = [
  SubmitCustomerProfileService,
  ResubmitCustomerProfileService,
  ApproveCustomerProfileService,
  RejectCustomerProfileService,
];

const queryHandlers = [
  FindCustomerCredentialsByEmailQueryHandler,
  GetCustomersQueryHandler,
  GetCustomerDetailQueryHandler,
  GetCustomerProfileQueryHandler,
  GetPendingCustomerProfilesQueryHandler,
  GetCustomerProfileReviewQueryHandler,
  GetPendingCustomerProfileReviewCountQueryHandler,
  // PORTAL
  GetCustomerQueryHandler,
];

@Module({
  controllers: [
    GetCustomersHttpController,
    GetCustomerHttpController,
    GetCustomerDetailHttpController,
    SubmitCustomerProfileHttpController,
    ResubmitCustomerProfileHttpController,
    GetCustomerProfileHttpController,
    GetPendingCustomerProfilesHttpController,
    GetCustomerProfileReviewHttpController,
    GetPendingCustomerProfileReviewCountHttpController,
    ApproveCustomerProfileHttpController,
    RejectCustomerProfileHttpController,
  ],
  providers: [
    CustomerRepository,
    {
      provide: CustomerPublicApi,
      useClass: CustomerApplicationService,
    },

    ...queryHandlers,
    ...commandServices,
  ],
  exports: [CustomerPublicApi],
})
export class CustomerModule {}
