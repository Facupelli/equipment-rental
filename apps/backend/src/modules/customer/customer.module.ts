import { Module } from '@nestjs/common';
import { CustomerRepositoryPort } from './application/ports/customer.repository.port';
import { CustomerController } from './infrastructure/controllers/customer.controller';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { FindCustomerCredentialsByEmailQueryHandler } from './application/queries/find-customer-credentials/find-customer-credentials.query-handler';
import { GetCustomersQueryHandler } from './application/queries/get-customers/get-customers.query-handler';
import { SubmitCustomerProfileCommandHandler } from './application/commands/submit-customer-profile/submit-customer-profile.command-handler';
import { ResubmitCustomerProfileCommandHandler } from './application/commands/resubmit-customer-profile/resubmit-customer-profile.command-handler';
import { CustomerApplicationService } from './application/customer.application-service';
import { CustomerPublicApi } from './customer.public-api';
import { GetCustomerDetailQueryHandler } from './application/queries/get-customer-detail/get-customer-detail.query-handler';
import { GetCustomerProfileQueryHandler } from './application/queries/get-customer-profile/get-customer-profile.query-handler';
import { GetCustomerQueryHandler } from './application/queries/get-customer/get-customer.query-handler';

const commandHandlers = [SubmitCustomerProfileCommandHandler, ResubmitCustomerProfileCommandHandler];

const queryHandlers = [
  FindCustomerCredentialsByEmailQueryHandler,
  GetCustomersQueryHandler,
  GetCustomerDetailQueryHandler,
  GetCustomerProfileQueryHandler,
  // PORTAL
  GetCustomerQueryHandler,
];

@Module({
  controllers: [CustomerController],
  providers: [
    {
      provide: CustomerRepositoryPort,
      useClass: CustomerRepository,
    },
    {
      provide: CustomerPublicApi,
      useClass: CustomerApplicationService,
    },

    ...queryHandlers,
    ...commandHandlers,
  ],
  exports: [CustomerPublicApi],
})
export class CustomerModule {}
