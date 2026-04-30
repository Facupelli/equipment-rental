export class RenderSignedOrderAgreementQuery {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
    public readonly signerFullName: string,
    public readonly declaredDocumentNumber: string,
    public readonly recipientEmail: string,
    public readonly signedAt: Date,
    public readonly sessionReference: string,
  ) {}
}
