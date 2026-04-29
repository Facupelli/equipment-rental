import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'neverthrow';

import {
  AcceptPublicSigningError,
  AcceptPublicSigningInput,
  AcceptPublicSigningResult,
  DocumentSigningFacade,
} from '../../document-signing.facade';
import { AcceptPublicSigningSessionCommand } from './accept-public-signing-session.command';

@Injectable()
@CommandHandler(AcceptPublicSigningSessionCommand)
export class AcceptPublicSigningSessionService
  implements
    ICommandHandler<
      AcceptPublicSigningSessionCommand,
      Result<AcceptPublicSigningResult, AcceptPublicSigningError>
    >
{
  constructor(private readonly documentSigningFacade: DocumentSigningFacade) {}

  async execute(
    command: AcceptPublicSigningSessionCommand,
  ): Promise<Result<AcceptPublicSigningResult, AcceptPublicSigningError>> {
    const input: AcceptPublicSigningInput = {
      rawToken: command.rawToken,
      declaredFullName: command.declaredFullName,
      declaredDocumentNumber: command.declaredDocumentNumber,
      acceptanceTextVersion: command.acceptanceTextVersion,
      accepted: command.accepted,
    };

    return this.documentSigningFacade.acceptPublicSigningSession(input);
  }
}
