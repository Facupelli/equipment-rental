import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { OrderDocumentRendererService } from 'src/modules/order/application/pdf/order-document-renderer.service';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import { OrderNotFoundError } from 'src/modules/order/domain/errors/order.errors';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';
import { PrepareSignedOrderAgreementQuery } from 'src/modules/order/public/queries/prepare-signed-order-agreement.query';
import { SignedOrderAgreementReadModel } from 'src/modules/order/public/read-models/signed-order-agreement.read-model';

type PrepareSignedOrderAgreementResult = Result<
  SignedOrderAgreementReadModel,
  ContractCustomerProfileMissingError | OrderNotFoundError
>;

@QueryHandler(PrepareSignedOrderAgreementQuery)
export class PrepareSignedOrderAgreementQueryHandler
  implements IQueryHandler<PrepareSignedOrderAgreementQuery, PrepareSignedOrderAgreementResult>
{
  constructor(private readonly orderDocumentRenderer: OrderDocumentRendererService) {}

  async execute(query: PrepareSignedOrderAgreementQuery): Promise<PrepareSignedOrderAgreementResult> {
    try {
      const renderResult = await this.orderDocumentRenderer.renderSignedContract(
        query.tenantId,
        query.orderId,
        query.signedSummary,
      );
      if (renderResult.isErr()) {
        return err(renderResult.error);
      }

      return ok({
        orderId: query.orderId,
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
