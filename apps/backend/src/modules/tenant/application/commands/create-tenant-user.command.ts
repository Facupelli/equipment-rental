import { ICommand } from '@nestjs/cqrs';
import { CreateTenantUserDto } from '../dto/create-tenant-user.dto';

export class CreateTenantUserCommand implements ICommand {
  constructor(
    public readonly user: CreateTenantUserDto['user'],
    public readonly tenant: CreateTenantUserDto['tenant'],
  ) {}
}
