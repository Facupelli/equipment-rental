import { Injectable } from '@nestjs/common';

import { Prisma, SigningDocumentType, SigningSessionStatus } from 'src/generated/prisma/client';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { PrismaService } from 'src/core/database/prisma.service';
import { SigningAuditEvent } from 'src/modules/document-signing/domain/entities/signing-audit-event.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';

import { SigningSessionMapper } from '../mappers/signing-session.mapper';

export class SigningAuditHistoryMismatchError extends Error {
  constructor(sessionId: string, sequence: number) {
    super(
      `Signing audit history mismatch for session '${sessionId}' at sequence ${sequence}. Persisted evidence cannot be rewritten.`,
    );
    this.name = 'SigningAuditHistoryMismatchError';
  }
}

@Injectable()
export class SigningSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runWithActiveSessionLock<T>(
    tenantId: string,
    orderId: string,
    documentType: SigningDocumentType,
    work: (tx: PrismaTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${tenantId}), hashtext(${`${orderId}:${documentType}`}))
      `;

      return work(tx);
    });
  }

  async load(id: string, tenantId: string): Promise<SigningSession | null> {
    const record = await this.prisma.client.signingSession.findFirst({
      where: { id, tenantId },
      include: {
        artifacts: true,
        auditEvents: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!record) {
      return null;
    }

    return SigningSessionMapper.toDomain(record);
  }

  async loadByTokenHash(tokenHash: string): Promise<SigningSession | null> {
    const record = await this.prisma.client.signingSession.findFirst({
      where: { tokenHash },
      include: {
        artifacts: true,
        auditEvents: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!record) {
      return null;
    }

    return SigningSessionMapper.toDomain(record);
  }

  async loadByFinalCopyTokenHash(tokenHash: string): Promise<SigningSession | null> {
    const record = await this.prisma.client.signingSession.findFirst({
      where: { finalCopyTokenHash: tokenHash },
      include: {
        artifacts: true,
        auditEvents: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!record) {
      return null;
    }

    return SigningSessionMapper.toDomain(record);
  }

  async loadActiveByOrderDocumentType(
    tenantId: string,
    orderId: string,
    documentType: SigningDocumentType,
    tx?: PrismaTransactionClient,
  ): Promise<SigningSession | null> {
    const client = tx ?? this.prisma.client;
    const record = await client.signingSession.findFirst({
      where: {
        tenantId,
        orderId,
        documentType,
        status: {
          notIn: [SigningSessionStatus.SIGNED, SigningSessionStatus.EXPIRED, SigningSessionStatus.VOIDED],
        },
      },
      include: {
        artifacts: true,
        auditEvents: {
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return null;
    }

    return SigningSessionMapper.toDomain(record);
  }

  async save(session: SigningSession, tx?: PrismaTransactionClient): Promise<string> {
    const client = tx ?? this.prisma.client;
    const { sessionRow, artifactRows, auditEventRows } = SigningSessionMapper.toPersistence(session);
    const auditEvents = session.getAuditEvents();
    const sessionRowWithoutArtifactLinks: Prisma.SigningSessionUncheckedCreateInput = {
      ...sessionRow,
      unsignedArtifactId: null,
      signedArtifactId: null,
    };

    await client.signingSession.upsert({
      where: { id: session.id },
      create: sessionRowWithoutArtifactLinks,
      update: sessionRowWithoutArtifactLinks as Prisma.SigningSessionUncheckedUpdateInput,
    });

    const existingArtifacts = await client.signingArtifact.findMany({
      where: { sessionId: session.id },
      select: { id: true },
    });
    const existingAuditEvents = await client.signingAuditEvent.findMany({
      where: { sessionId: session.id },
      orderBy: { sequence: 'asc' },
      select: {
        id: true,
        sessionId: true,
        sequence: true,
        type: true,
        payload: true,
        occurredAt: true,
        previousHash: true,
        currentHash: true,
      },
    });

    const nextArtifactIds = new Set(artifactRows.map((artifact) => artifact.id));

    const staleArtifactIds = existingArtifacts.map((artifact) => artifact.id).filter((id) => !nextArtifactIds.has(id));

    if (staleArtifactIds.length > 0) {
      await client.signingArtifact.deleteMany({
        where: { id: { in: staleArtifactIds } },
      });
    }

    for (const artifactRow of artifactRows) {
      await client.signingArtifact.upsert({
        where: { id: artifactRow.id },
        create: artifactRow,
        update: artifactRow as Prisma.SigningArtifactUncheckedUpdateInput,
      });
    }

    if (existingAuditEvents.length > auditEvents.length) {
      throw new SigningAuditHistoryMismatchError(
        session.id,
        existingAuditEvents[auditEvents.length]?.sequence ?? auditEvents.length + 1,
      );
    }

    for (let index = 0; index < existingAuditEvents.length; index += 1) {
      const persistedEvent = existingAuditEvents[index];
      const currentEvent = auditEvents[index];

      if (!currentEvent || !this.auditEventsMatch(persistedEvent, currentEvent)) {
        throw new SigningAuditHistoryMismatchError(session.id, persistedEvent.sequence);
      }
    }

    for (const auditEventRow of auditEventRows.slice(existingAuditEvents.length)) {
      await client.signingAuditEvent.create({
        data: auditEventRow,
      });
    }

    await client.signingSession.update({
      where: { id: session.id },
      data: sessionRow as Prisma.SigningSessionUncheckedUpdateInput,
    });

    return session.id;
  }

  private auditEventsMatch(
    persistedEvent: {
      id: string;
      sessionId: string;
      sequence: number;
      type: Prisma.SigningAuditEventUncheckedCreateInput['type'];
      payload: Prisma.JsonValue;
      occurredAt: Date;
      previousHash: string | null;
      currentHash: string;
    },
    currentEvent: SigningAuditEvent,
  ): boolean {
    return (
      persistedEvent.id === currentEvent.id &&
      persistedEvent.sessionId === currentEvent.sessionId &&
      persistedEvent.sequence === currentEvent.sequence &&
      persistedEvent.type === currentEvent.type &&
      persistedEvent.occurredAt.getTime() === currentEvent.occurredAt.getTime() &&
      persistedEvent.previousHash === currentEvent.previousHash &&
      persistedEvent.currentHash === currentEvent.currentHash
    );
  }
}
