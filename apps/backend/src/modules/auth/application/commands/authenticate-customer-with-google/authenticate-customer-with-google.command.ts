import { ICommand } from '@nestjs/cqrs';

export class AuthenticateCustomerWithGoogleCommand implements ICommand {
  constructor(
    public readonly code: string,
    public readonly redirectUri: string,
    public readonly state: string,
    public readonly codeVerifier?: string,
  ) {}
}
