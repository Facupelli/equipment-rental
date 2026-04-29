export interface SignedOrderAgreementSummaryInput {
  signerFullName: string;
  declaredDocumentNumber: string;
  recipientEmail: string;
  signedAt: string;
  sessionReference: string;
}

export class PrepareSignedOrderAgreementQuery {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
    public readonly signedSummary: SignedOrderAgreementSummaryInput,
  ) {}
}
