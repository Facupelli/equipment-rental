import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerRepositoryPort } from './application/ports/customer.repository.port';
import { CustomerController } from './infrastructure/customer.controller';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';

@Module({
  controllers: [CustomerController],
  providers: [
    {
      provide: CustomerRepositoryPort,
      useClass: CustomerRepository,
    },

    CustomerService,
  ],
})
export class CustomerModule {}
