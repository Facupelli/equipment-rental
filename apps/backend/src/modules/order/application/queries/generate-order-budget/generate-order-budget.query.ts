import { GenerateOrderBudgetCustomerDto } from '@repo/schemas';

export class GenerateOrderBudgetQuery {
  constructor(
    readonly tenantId: string,
    readonly orderId: string,
    readonly customer?: GenerateOrderBudgetCustomerDto,
  ) {}
}

export interface GenerateOrderBudgetResult {
  buffer: Buffer;
  documentNumber: string;
  downloadFileName: string;
}
