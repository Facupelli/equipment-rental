import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { OrderDocumentRendererService } from 'src/modules/order/application/pdf/order-document-renderer.service';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import {
  OrderNotFoundError,
  OrderSigningAllowedOnlyForConfirmedOrdersError,
} from 'src/modules/order/domain/errors/order.errors';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';
import { RenderSignedOrderAgreementQuery } from 'src/modules/order/public/queries/render-signed-order-agreement.query';
import { RenderedOrderAgreementReadModel } from 'src/modules/order/public/read-models/rendered-order-agreement.read-model';

type RenderSignedOrderAgreementResult = Result<
  RenderedOrderAgreementReadModel,
  ContractCustomerProfileMissingError | OrderNotFoundError | OrderSigningAllowedOnlyForConfirmedOrdersError
>;

@QueryHandler(RenderSignedOrderAgreementQuery)
export class RenderSignedOrderAgreementQueryHandler implements IQueryHandler<
  RenderSignedOrderAgreementQuery,
  RenderSignedOrderAgreementResult
> {
  constructor(private readonly orderDocumentRenderer: OrderDocumentRendererService) {}

  async execute(query: RenderSignedOrderAgreementQuery): Promise<RenderSignedOrderAgreementResult> {
    try {
      const renderResult = await this.orderDocumentRenderer.renderSignedContract(query.tenantId, query.orderId, {
        signerFullName: query.signerFullName,
        declaredDocumentNumber: query.declaredDocumentNumber,
        recipientEmail: query.recipientEmail,
        signedAt: query.signedAt,
        sessionReference: query.sessionReference,
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
