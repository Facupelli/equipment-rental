import { Body, Controller, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async create(@Body() dto: CreateCustomerDto): Promise<string> {
    return await this.customerService.create(dto);
  }
}
