import { ICommand } from '@nestjs/cqrs';
import { RegisterDto } from '@repo/schemas';

export class RegisterTenantCommand implements ICommand {
  constructor(
    public readonly user: RegisterDto['user'],
    public readonly tenant: RegisterDto['tenant'],
  ) {}
}
