import { Module } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CustomerService } from './customer.service';

@Module({
  providers: [CustomerRepository, CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
