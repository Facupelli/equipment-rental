import { Injectable } from '@nestjs/common';

import { Prisma, SigningDocumentType, SigningSessionStatus } from 'src/generated/prisma/client';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { PrismaService } from 'src/core/database/prisma.service';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';

import { SigningSessionMapper } from '../mappers/signing-session.mapper';

@Injectable()
export class SigningSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async loadByTokenHash(tokenHash: string, tenantId: string): Promise<SigningSession | null> {
    const record = await this.prisma.client.signingSession.findFirst({
      where: { tokenHash, tenantId },
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
  ): Promise<SigningSession | null> {
    const record = await this.prisma.client.signingSession.findFirst({
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
      select: { id: true },
    });

    const nextArtifactIds = new Set(artifactRows.map((artifact) => artifact.id));
    const nextAuditEventIds = new Set(auditEventRows.map((event) => event.id));

    const staleArtifactIds = existingArtifacts.map((artifact) => artifact.id).filter((id) => !nextArtifactIds.has(id));
    const staleAuditEventIds = existingAuditEvents.map((event) => event.id).filter((id) => !nextAuditEventIds.has(id));

    if (staleAuditEventIds.length > 0) {
      await client.signingAuditEvent.deleteMany({
        where: { id: { in: staleAuditEventIds } },
      });
    }

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

    for (const auditEventRow of auditEventRows) {
      await client.signingAuditEvent.upsert({
        where: { id: auditEventRow.id },
        create: auditEventRow,
        update: auditEventRow as Prisma.SigningAuditEventUncheckedUpdateInput,
      });
    }

    await client.signingSession.update({
      where: { id: session.id },
      data: sessionRow as Prisma.SigningSessionUncheckedUpdateInput,
    });

    return session.id;
  }
}
