import { IQuery } from '@nestjs/cqrs';

// Platform-global back-office email uniqueness check, currently used by tenant registration.
export class IsEmailTakenQuery implements IQuery {
  constructor(public readonly email: string) {}
}
