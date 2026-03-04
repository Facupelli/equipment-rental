import { ICommand } from '@nestjs/cqrs';

export interface CreateTenantUserCommandProps {
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  tenant: {
    name: string;
  };
}

export class CreateTenantUserCommand implements ICommand {
  constructor(
    public readonly user: CreateTenantUserCommandProps['user'],
    public readonly tenant: CreateTenantUserCommandProps['tenant'],
  ) {}
}
