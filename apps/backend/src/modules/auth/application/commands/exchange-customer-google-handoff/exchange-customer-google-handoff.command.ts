import { ICommand } from '@nestjs/cqrs';

export class ExchangeCustomerGoogleHandoffCommand implements ICommand {
  constructor(public readonly handoffToken: string) {}
}
