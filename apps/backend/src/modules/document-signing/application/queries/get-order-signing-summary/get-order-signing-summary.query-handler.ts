import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from 'src/generated/prisma/client';
import { SigningAuditEventType, SigningSessionStatus } from 'src/generated/prisma/client';

import { PrismaService } from 'src/core/database/prisma.service';
import {
  GetOrderSigningSummaryQuery,
  OrderSigningSummaryReadModel,
  OrderSigningSummaryStatus,
  SigningDeliverySummaryReadModel,
} from 'src/modules/document-signing/public/queries/get-order-signing-summary.query';

const INVITATION_DELIVERY_EVENT_TYPES = [
  SigningAuditEventType.INVITATION_EMAIL_FAILED,
  SigningAuditEventType.INVITATION_EMAIL_SENT,
  SigningAuditEventType.INVITATION_EMAIL_REQUESTED,
] as const;

const FINAL_COPY_DELIVERY_EVENT_TYPES = [
  SigningAuditEventType.FINAL_COPY_EMAIL_FAILED,
  SigningAuditEventType.FINAL_COPY_EMAIL_SENT,
  SigningAuditEventType.FINAL_COPY_EMAIL_REQUESTED,
] as const;

type SigningAuditEventRow = {
  type: SigningAuditEventType;
  occurredAt: Date;
  payload: Prisma.JsonValue;
};

@QueryHandler(GetOrderSigningSummaryQuery)
export class GetOrderSigningSummaryQueryHandler implements IQueryHandler<
  GetOrderSigningSummaryQuery,
  OrderSigningSummaryReadModel
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrderSigningSummaryQuery): Promise<OrderSigningSummaryReadModel> {
    const session = await this.prisma.client.signingSession.findFirst({
      where: {
        tenantId: query.tenantId,
        orderId: query.orderId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        documentType: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        openedAt: true,
        signedAt: true,
        auditEvents: {
          orderBy: [{ occurredAt: 'desc' }, { sequence: 'desc' }],
          select: {
            type: true,
            occurredAt: true,
            payload: true,
          },
        },
      },
    });

    if (!session) {
      return buildNoSessionSummary();
    }

    const effectiveStatus = resolveEffectiveStatus(session.status, session.expiresAt, new Date());

    return {
      status: effectiveStatus,
      documentType: session.documentType,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      openedAt: session.openedAt,
      signedAt: session.signedAt,
      latestInvitationDelivery: resolveDeliverySummary(session.auditEvents, INVITATION_DELIVERY_EVENT_TYPES),
      latestFinalCopyDelivery: resolveDeliverySummary(session.auditEvents, FINAL_COPY_DELIVERY_EVENT_TYPES),
    };
  }
}

function buildNoSessionSummary(): OrderSigningSummaryReadModel {
  return {
    status: 'NO_SESSION',
    documentType: null,
    createdAt: null,
    expiresAt: null,
    openedAt: null,
    signedAt: null,
    latestInvitationDelivery: emptyDeliverySummary(),
    latestFinalCopyDelivery: emptyDeliverySummary(),
  };
}

function emptyDeliverySummary(): SigningDeliverySummaryReadModel {
  return {
    status: 'NOT_SENT',
    occurredAt: null,
    recipientEmail: null,
    failureReason: null,
    failureMessage: null,
  };
}

function resolveEffectiveStatus(status: SigningSessionStatus, expiresAt: Date, now: Date): OrderSigningSummaryStatus {
  if (
    (status === SigningSessionStatus.PENDING || status === SigningSessionStatus.OPENED) &&
    expiresAt.getTime() <= now.getTime()
  ) {
    return 'EXPIRED';
  }

  return status;
}

function resolveDeliverySummary(
  auditEvents: SigningAuditEventRow[],
  relevantTypes: readonly SigningAuditEventType[],
): SigningDeliverySummaryReadModel {
  const latestEvent = auditEvents.find((event) => relevantTypes.includes(event.type));
  if (!latestEvent) {
    return emptyDeliverySummary();
  }

  const payload = asRecord(latestEvent.payload);

  return {
    status: mapDeliveryStatus(latestEvent.type),
    occurredAt: latestEvent.occurredAt,
    recipientEmail: readString(payload, 'recipientEmail'),
    failureReason: readString(payload, 'failureReason'),
    failureMessage: readString(payload, 'failureMessage'),
  };
}

function mapDeliveryStatus(type: SigningAuditEventType): SigningDeliverySummaryReadModel['status'] {
  switch (type) {
    case SigningAuditEventType.INVITATION_EMAIL_REQUESTED:
    case SigningAuditEventType.FINAL_COPY_EMAIL_REQUESTED:
      return 'REQUESTED';
    case SigningAuditEventType.INVITATION_EMAIL_SENT:
    case SigningAuditEventType.FINAL_COPY_EMAIL_SENT:
      return 'SENT';
    case SigningAuditEventType.INVITATION_EMAIL_FAILED:
    case SigningAuditEventType.FINAL_COPY_EMAIL_FAILED:
      return 'FAILED';
    default:
      return 'NOT_SENT';
  }
}

function asRecord(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Prisma.JsonValue>;
}

function readString(record: Record<string, Prisma.JsonValue> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === 'string' ? value : null;
}
