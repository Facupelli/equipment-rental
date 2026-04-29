import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrderStatus } from '@repo/types';
import { Result, err, ok } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { OrderDocumentRendererService } from 'src/modules/order/application/pdf/order-document-renderer.service';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import {
  OrderNotFoundError,
  OrderSigningAllowedOnlyForConfirmedOrdersError,
} from 'src/modules/order/domain/errors/order.errors';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';
import { PrepareOrderAgreementForSigningQuery } from 'src/modules/order/public/queries/prepare-order-agreement-for-signing.query';
import { OrderAgreementForSigningReadModel } from 'src/modules/order/public/read-models/order-agreement-for-signing.read-model';

type PrepareOrderAgreementForSigningResult = Result<
  OrderAgreementForSigningReadModel,
  ContractCustomerProfileMissingError | OrderNotFoundError | OrderSigningAllowedOnlyForConfirmedOrdersError
>;

@QueryHandler(PrepareOrderAgreementForSigningQuery)
export class PrepareOrderAgreementForSigningQueryHandler implements IQueryHandler<
  PrepareOrderAgreementForSigningQuery,
  PrepareOrderAgreementForSigningResult
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderDocumentRenderer: OrderDocumentRendererService,
  ) {}

  async execute(query: PrepareOrderAgreementForSigningQuery): Promise<PrepareOrderAgreementForSigningResult> {
    const order = await this.prisma.client.order.findFirst({
      where: {
        id: query.orderId,
        tenantId: query.tenantId,
      },
      select: {
        id: true,
        status: true,
        customerId: true,
        customer: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return err(new OrderNotFoundError(query.orderId));
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      return err(new OrderSigningAllowedOnlyForConfirmedOrdersError(order.id, order.status as OrderStatus));
    }

    try {
      const renderResult = await this.orderDocumentRenderer.renderContract(query.tenantId, query.orderId);
      if (renderResult.isErr()) {
        return err(renderResult.error);
      }

      return ok({
        orderId: order.id,
        customerId: order.customerId,
        customerEmail: order.customer?.email ?? null,
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
