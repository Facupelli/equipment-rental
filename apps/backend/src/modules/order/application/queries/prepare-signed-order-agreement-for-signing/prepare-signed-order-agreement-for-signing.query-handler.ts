import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { OrderDocumentRendererService } from 'src/modules/order/application/pdf/order-document-renderer.service';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import { OrderNotFoundError } from 'src/modules/order/domain/errors/order.errors';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';
import { PrepareSignedOrderAgreementForSigningQuery } from 'src/modules/order/public/queries/prepare-signed-order-agreement-for-signing.query';
import { RenderedOrderAgreementReadModel } from 'src/modules/order/public/read-models/rendered-order-agreement.read-model';

type PrepareSignedOrderAgreementForSigningResult = Result<
  RenderedOrderAgreementReadModel,
  ContractCustomerProfileMissingError | OrderNotFoundError
>;

@QueryHandler(PrepareSignedOrderAgreementForSigningQuery)
export class PrepareSignedOrderAgreementForSigningQueryHandler implements IQueryHandler<
  PrepareSignedOrderAgreementForSigningQuery,
  PrepareSignedOrderAgreementForSigningResult
> {
  constructor(private readonly orderDocumentRenderer: OrderDocumentRendererService) {}

  async execute(
    query: PrepareSignedOrderAgreementForSigningQuery,
  ): Promise<PrepareSignedOrderAgreementForSigningResult> {
    try {
      const renderResult = await this.orderDocumentRenderer.renderSignedContract(query.tenantId, query.orderId, {
        signatureImageDataUrl: query.signatureImageDataUrl,
        recipientEmail: query.recipientEmail,
        signedAt: query.signedAt,
        sessionReference: query.requestId,
      });
      if (renderResult.isErr()) {
        return err(renderResult.error);
      }

      return ok({
        buffer: renderResult.value.buffer,
        documentNumber: renderResult.value.documentNumber,
        fileName: renderResult.value.fileName,
      });
    } catch (error) {
      if (error instanceof OrderNotFoundException) {
        return err(new OrderNotFoundError(query.orderId));
      }

      throw error;
    }
  }
}
