export class GenerateSignedOrderContractQuery {
  constructor(
    readonly tenantId: string,
    readonly orderId: string,
  ) {}
}

export interface GenerateSignedOrderContractResult {
  buffer: Buffer;
  documentNumber: string;
  downloadFileName: string;
}
