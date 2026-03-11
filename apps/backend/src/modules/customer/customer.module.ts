import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerRepositoryPort } from './application/ports/customer.repository.port';
import { CustomerController } from './infrastructure/controllers/customer.controller';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { FindCustomerCredentialsByEmailQueryHandler } from './application/queries/find-customer-credentials/find-customer-credentials.query-handler';
import { GetCustomersQueryHandler } from './application/queries/get-customers/get-customers.query-handler';
import { SubmitCustomerProfileCommandHandler } from './application/commands/submit-customer-profile/submit-customer-profile.command-handler';
import { ResubmitCustomerProfileCommandHandler } from './application/commands/resubmit-customer-profile/resubmit-customer-profile.command-handler';

const commandHandlers = [SubmitCustomerProfileCommandHandler, ResubmitCustomerProfileCommandHandler];
const queryHandlers = [FindCustomerCredentialsByEmailQueryHandler, GetCustomersQueryHandler];

@Module({
  controllers: [CustomerController],
  providers: [
    {
      provide: CustomerRepositoryPort,
      useClass: CustomerRepository,
    },

    CustomerService,
    ...queryHandlers,
    ...commandHandlers,
  ],
})
export class CustomerModule {}
