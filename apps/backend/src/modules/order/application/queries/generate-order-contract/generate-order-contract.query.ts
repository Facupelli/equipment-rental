export class GenerateOrderContractQuery {
  constructor(
    readonly tenantId: string,
    readonly orderId: string,
  ) {}
}

export interface GenerateOrderContractResult {
  buffer: Buffer;
  remitoNumber: string;
  downloadFileName: string;
}
