import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { SigningDocumentType } from 'src/generated/prisma/client';
import { DocumentSigningPublicApi } from 'src/modules/document-signing/document-signing.public-api';
import { OrderDocumentRendererService } from 'src/modules/order/application/pdf/order-document-renderer.service';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import { OrderNotFoundError } from 'src/modules/order/domain/errors/order.errors';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';

import { PrepareOrderContractForSigningCommand } from './prepare-order-contract-for-signing.command';

export interface PrepareOrderContractForSigningResult {
  sessionId: string;
  buffer: Buffer;
  documentNumber: string;
  fileName: string;
  unsignedDocumentHash: string;
  reusedExistingSession: boolean;
}

type PrepareOrderContractForSigningError = ContractCustomerProfileMissingError | OrderNotFoundError;

@Injectable()
@CommandHandler(PrepareOrderContractForSigningCommand)
export class PrepareOrderContractForSigningService
  implements
    ICommandHandler<
      PrepareOrderContractForSigningCommand,
      Result<PrepareOrderContractForSigningResult, PrepareOrderContractForSigningError>
    >
{
  constructor(
    private readonly orderDocumentRenderer: OrderDocumentRendererService,
    private readonly documentSigningApi: DocumentSigningPublicApi,
  ) {}

  async execute(
    command: PrepareOrderContractForSigningCommand,
  ): Promise<Result<PrepareOrderContractForSigningResult, PrepareOrderContractForSigningError>> {
    let renderResult: Awaited<ReturnType<OrderDocumentRendererService['renderContract']>>;

    try {
      renderResult = await this.orderDocumentRenderer.renderContract(command.tenantId, command.orderId);
    } catch (error) {
      if (error instanceof OrderNotFoundException) {
        return err(new OrderNotFoundError(command.orderId));
      }

      throw error;
    }

    if (renderResult.isErr()) {
      return err(renderResult.error);
    }

    const renderedContract = renderResult.value;
    const signingResult = await this.documentSigningApi.prepareSigningSession({
      tenantId: command.tenantId,
      orderId: command.orderId,
      customerId: renderedContract.customerId,
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
      recipientEmail: command.recipientEmail,
      rawToken: command.rawToken,
      expiresAt: command.expiresAt,
      documentNumber: renderedContract.documentNumber,
      fileName: renderedContract.fileName,
      pdfBytes: renderedContract.buffer,
    });

    return ok({
      sessionId: signingResult.sessionId,
      buffer: renderedContract.buffer,
      documentNumber: renderedContract.documentNumber,
      fileName: `${renderedContract.fileName}.pdf`,
      unsignedDocumentHash: signingResult.unsignedDocumentHash,
      reusedExistingSession: signingResult.reusedExistingSession,
    });
  }
}
