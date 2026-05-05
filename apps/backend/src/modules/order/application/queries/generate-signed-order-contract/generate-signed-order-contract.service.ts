import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { Result, err } from 'neverthrow';

import {
  GetLatestSignedOrderSigningRequestQuery,
  SignedOrderSigningRequestReadModel,
} from 'src/modules/document-signing/public/queries/get-latest-signed-order-signing-request.query';
import { OrderDocumentRendererService } from 'src/modules/order/application/pdf/order-document-renderer.service';
import {
  ContractCustomerProfileMissingError,
  SignedOrderContractNotFoundError,
} from 'src/modules/order/domain/errors/contract.errors';

import {
  GenerateSignedOrderContractQuery,
  GenerateSignedOrderContractResult,
} from './generate-signed-order-contract.query';

type GenerateSignedOrderContractQueryResult = Result<
  GenerateSignedOrderContractResult,
  ContractCustomerProfileMissingError | SignedOrderContractNotFoundError
>;

@QueryHandler(GenerateSignedOrderContractQuery)
export class GenerateSignedOrderContractService implements IQueryHandler<
  GenerateSignedOrderContractQuery,
  GenerateSignedOrderContractQueryResult
> {
  constructor(
    private readonly orderDocumentRenderer: OrderDocumentRendererService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GenerateSignedOrderContractQuery): Promise<GenerateSignedOrderContractQueryResult> {
    const signingRequest = await this.queryBus.execute<
      GetLatestSignedOrderSigningRequestQuery,
      SignedOrderSigningRequestReadModel | null
    >(new GetLatestSignedOrderSigningRequestQuery(query.tenantId, query.orderId));

    if (!signingRequest) {
      return err(new SignedOrderContractNotFoundError(query.orderId));
    }

    return this.orderDocumentRenderer.renderSignedContract(query.tenantId, query.orderId, {
      signatureImageDataUrl: signingRequest.signatureImageDataUrl,
      recipientEmail: signingRequest.recipientEmail,
      signedAt: signingRequest.signedAt,
      sessionReference: signingRequest.requestId,
    });
  }
}
