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

const commandServices = [SubmitCustomerProfileService, ResubmitCustomerProfileService];

const queryHandlers = [
  FindCustomerCredentialsByEmailQueryHandler,
  GetCustomersQueryHandler,
  GetCustomerDetailQueryHandler,
  GetCustomerProfileQueryHandler,
  // PORTAL
  GetCustomerQueryHandler,
];

@Module({
  controllers: [
    GetCustomersHttpController,
    GetCustomerDetailHttpController,
    GetCustomerHttpController,
    SubmitCustomerProfileHttpController,
    ResubmitCustomerProfileHttpController,
    GetCustomerProfileHttpController,
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
