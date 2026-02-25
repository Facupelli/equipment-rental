import { Module } from '@nestjs/common';
import { PrismaCustomerRepository } from './prisma-customer.repository';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './ports/customer.repository';
import { RentalCustomerQueryPort } from '../rental/domain/ports/rental-customer.port';
import { CustomerController } from './customer.controller';

@Module({
  controllers: [CustomerController],
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
