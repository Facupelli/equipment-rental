export class PrepareSignedOrderAgreementForSigningQuery {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
    public readonly signatureImageDataUrl: string,
    public readonly recipientEmail: string,
    public readonly signedAt: Date,
    public readonly requestId: string,
  ) {}
}
