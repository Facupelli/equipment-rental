import { Module } from '@nestjs/common';
import { PrismaCustomerRepository } from './customer.repository';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './ports/customer-service.repository';
import { RentalCustomerQueryPort } from '../rental/domain/ports/rental-customer.port';

@Module({
  providers: [
    {
      provide: CustomerRepository,
      useClass: PrismaCustomerRepository,
    },
    {
      provide: RentalCustomerQueryPort,
      useClass: PrismaCustomerRepository,
    },
    CustomerService,
  ],
  exports: [CustomerService, RentalCustomerQueryPort],
})
export class CustomerModule {}
