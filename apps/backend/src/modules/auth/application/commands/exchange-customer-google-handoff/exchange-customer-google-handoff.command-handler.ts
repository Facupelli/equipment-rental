import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { ActorType } from '@repo/types';
import { err, ok, Result } from 'neverthrow';

import { FindCustomerForAuthByIdQuery } from 'src/modules/customer/public/queries/find-customer-for-auth-by-id.query';
import { CustomerForAuthReadModel } from 'src/modules/customer/public/read-models/customer-for-auth.read-model';

import { AuthService } from '../../auth.service';
import { ExchangeCustomerGoogleHandoffCommand } from './exchange-customer-google-handoff.command';
import {
  AuthHandoffTokenAlreadyUsedError,
  AuthHandoffTokenExpiredError,
  CustomerUnavailableForAuthenticationError,
  InvalidAuthHandoffTokenError,
} from '../../../domain/errors/auth.errors';
import { AuthHandoffTokenRepository } from '../../../infrastructure/repositories/auth-handoff-token.repository';

export type ExchangeCustomerGoogleHandoffResult = Result<
  { accessToken: string; refreshToken: string },
  | InvalidAuthHandoffTokenError
  | AuthHandoffTokenAlreadyUsedError
  | AuthHandoffTokenExpiredError
  | CustomerUnavailableForAuthenticationError
>;

@CommandHandler(ExchangeCustomerGoogleHandoffCommand)
export class ExchangeCustomerGoogleHandoffCommandHandler implements ICommandHandler<
  ExchangeCustomerGoogleHandoffCommand,
  ExchangeCustomerGoogleHandoffResult
> {
  constructor(
    private readonly authService: AuthService,
    private readonly authHandoffTokenRepository: AuthHandoffTokenRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: ExchangeCustomerGoogleHandoffCommand): Promise<ExchangeCustomerGoogleHandoffResult> {
    const handoffToken = await this.authHandoffTokenRepository.findByRawToken(command.handoffToken);

    if (!handoffToken || handoffToken.actorType !== ActorType.CUSTOMER) {
      return err(new InvalidAuthHandoffTokenError());
    }

    const useResult = handoffToken.use();
    if (useResult.isErr()) {
      return err(useResult.error);
    }

    await this.authHandoffTokenRepository.save(handoffToken);

    const customer = await this.queryBus.execute<FindCustomerForAuthByIdQuery, CustomerForAuthReadModel | null>(
      new FindCustomerForAuthByIdQuery(handoffToken.actorId),
    );

    if (!customer || !customer.isActive || customer.deletedAt !== null) {
      return err(new CustomerUnavailableForAuthenticationError(handoffToken.actorId, handoffToken.tenantId));
    }

    return ok(
      await this.authService.login({
        id: customer.id,
        email: customer.email,
        tenantId: customer.tenantId,
        actorType: ActorType.CUSTOMER,
      }),
    );
  }
}
