export const DocumentSigningPublicDocumentTypes = {
  RENTAL_AGREEMENT: 'RENTAL_AGREEMENT',
} as const;

export type DocumentSigningPublicDocumentType =
  (typeof DocumentSigningPublicDocumentTypes)[keyof typeof DocumentSigningPublicDocumentTypes];

export type OrderSigningSummaryStatus = 'NO_SESSION' | 'PENDING' | 'OPENED' | 'SIGNED' | 'EXPIRED' | 'VOIDED';

export type SigningDeliverySummaryStatus = 'NOT_SENT' | 'REQUESTED' | 'SENT' | 'FAILED';

export type SigningDeliverySummaryReadModel = {
  status: SigningDeliverySummaryStatus;
  occurredAt: Date | null;
  recipientEmail: string | null;
  failureReason: string | null;
  failureMessage: string | null;
};

export type OrderSigningSummaryReadModel = {
  status: OrderSigningSummaryStatus;
  documentType: DocumentSigningPublicDocumentType | null;
  createdAt: Date | null;
  expiresAt: Date | null;
  openedAt: Date | null;
  signedAt: Date | null;
  latestInvitationDelivery: SigningDeliverySummaryReadModel;
  latestFinalCopyDelivery: SigningDeliverySummaryReadModel;
};

export class GetOrderSigningSummaryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
    public readonly documentType: DocumentSigningPublicDocumentType,
  ) {}
}
