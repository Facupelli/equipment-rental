import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Result } from 'neverthrow';

import { OrderDocumentRendererService } from 'src/modules/order/application/pdf/order-document-renderer.service';
import { OrderBudgetMustBeDraftError } from 'src/modules/order/domain/errors/contract.errors';

import { GenerateOrderBudgetQuery, GenerateOrderBudgetResult } from './generate-order-budget.query';

type GenerateOrderBudgetQueryResult = Result<GenerateOrderBudgetResult, OrderBudgetMustBeDraftError>;

@QueryHandler(GenerateOrderBudgetQuery)
export class GenerateOrderBudgetService implements IQueryHandler<
  GenerateOrderBudgetQuery,
  GenerateOrderBudgetQueryResult
> {
  constructor(private readonly orderDocumentRenderer: OrderDocumentRendererService) {}

  async execute(query: GenerateOrderBudgetQuery): Promise<GenerateOrderBudgetQueryResult> {
    return this.orderDocumentRenderer.renderBudget(query.tenantId, query.orderId, query.customer);
  }
}
