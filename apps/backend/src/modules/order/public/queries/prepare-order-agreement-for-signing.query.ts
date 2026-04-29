export class PrepareOrderAgreementForSigningQuery {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
  ) {}
}
