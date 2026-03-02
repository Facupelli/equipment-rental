import { Module } from '@nestjs/common';
import { PrismaCustomerRepository } from './infrastructure/prisma-customer.repository';
import { CustomerService } from './customer.service';
import { CustomerRepositoryPort } from './application/ports/customer.repository.port';
import { CustomerController } from './infrastructure/customer.controller';
import { CustomerQueryPort } from './application/ports/customer-query.port';

@Module({
  controllers: [CustomerController],
  providers: [
    {
      provide: CustomerRepositoryPort,
      useClass: PrismaCustomerRepository,
    },
    {
      // TODO: export a service instead of the repo
      provide: CustomerQueryPort,
      useClass: PrismaCustomerRepository,
    },
    CustomerService,
  ],
  exports: [CustomerQueryPort],
})
export class CustomerModule {}
