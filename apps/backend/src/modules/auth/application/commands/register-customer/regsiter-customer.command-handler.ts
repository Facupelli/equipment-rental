import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterCustomerCommand } from './regsiter-customer.command';
import { BcryptService } from 'src/modules/auth/application/bcript.service';
import { CustomerPublicApi, RegisterCustomerPublicInput } from 'src/modules/customer/customer.public-api';

@CommandHandler(RegisterCustomerCommand)
export class RegisterCustomerCommandHandler implements ICommandHandler<RegisterCustomerCommand> {
  constructor(
    private readonly bcryptService: BcryptService,
    private readonly customerApi: CustomerPublicApi,
  ) {}

  async execute(command: RegisterCustomerCommand) {
    const passwordHash = await this.bcryptService.hashPassword(command.password);
    const input: RegisterCustomerPublicInput = {
      tenantId: command.tenantId,
      email: command.email,
      passwordHash,
      firstName: command.firstName,
      lastName: command.lastName,
      isCompany: command.isCompany,
      companyName: command.companyName,
    };

    const customerId = await this.customerApi.register(input);

    return customerId;
  }
}
