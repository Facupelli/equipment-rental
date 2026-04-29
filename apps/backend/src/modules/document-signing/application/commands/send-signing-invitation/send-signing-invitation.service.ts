import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'neverthrow';

import {
  SendSigningInvitationInput,
  SendSigningInvitationResult,
  DocumentSigningFacade,
} from '../../document-signing.facade';
import { SendSigningInvitationCommand } from './send-signing-invitation.command';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import {
  OrderNotFoundError,
  OrderSigningAllowedOnlyForConfirmedOrdersError,
} from 'src/modules/order/domain/errors/order.errors';
import {
  SigningInvitationEmailDeliveryFailedError,
  SigningInvitationRecipientEmailRequiredError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';

export type SendSigningInvitationCommandError =
  | ContractCustomerProfileMissingError
  | OrderNotFoundError
  | OrderSigningAllowedOnlyForConfirmedOrdersError
  | SigningInvitationRecipientEmailRequiredError
  | SigningInvitationEmailDeliveryFailedError;

@Injectable()
@CommandHandler(SendSigningInvitationCommand)
export class SendSigningInvitationService implements ICommandHandler<
  SendSigningInvitationCommand,
  Result<SendSigningInvitationResult, SendSigningInvitationCommandError>
> {
  constructor(private readonly documentSigningFacade: DocumentSigningFacade) {}

  async execute(
    command: SendSigningInvitationCommand,
  ): Promise<Result<SendSigningInvitationResult, SendSigningInvitationCommandError>> {
    const input: SendSigningInvitationInput = {
      tenantId: command.tenantId,
      orderId: command.orderId,
      documentType: command.documentType,
      recipientEmail: command.recipientEmail,
    };

    return this.documentSigningFacade.sendSigningInvitation(input);
  }
}
