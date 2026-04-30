import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';

import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { SigningAuditEventType, SigningDocumentType, SigningSessionStatus } from 'src/generated/prisma/client';

import { SigningSession } from '../domain/entities/signing-session.entity';
import {
  SigningSessionExpiredError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
} from '../domain/errors/document-signing.errors';
import { SigningSessionRepository } from '../infrastructure/persistence/repositories/signing-session.repository';
import { SigningAuditAppender } from './signing-audit-appender.service';

@Injectable()
export class PublicSigningSessionLoader {
  constructor(
    private readonly signingSessionRepository: SigningSessionRepository,
    private readonly signingAuditAppender: SigningAuditAppender,
  ) {}

  async loadActiveReusableSession(
    tenantId: string,
    orderId: string,
    documentType: SigningDocumentType,
    now: Date,
    tx?: PrismaTransactionClient,
  ): Promise<SigningSession | null> {
    const session = await this.signingSessionRepository.loadActiveByOrderDocumentType(
      tenantId,
      orderId,
      documentType,
      tx,
    );
    if (!session) {
      return null;
    }

    return (await this.expireSessionIfNeeded(session, now, tx)) ? null : session;
  }

  async loadRequiredPublicSession(rawToken: string): Promise<SigningSession> {
    const normalizedToken = rawToken.trim();
    if (normalizedToken.length === 0) {
      throw new SigningSessionTokenNotFoundError();
    }

    const session = await this.signingSessionRepository.loadByTokenHash(hashString(normalizedToken));
    if (!session) {
      throw new SigningSessionTokenNotFoundError();
    }

    const now = new Date();
    const expired = await this.expireSessionIfNeeded(session, now);
    if (expired || session.currentStatus === SigningSessionStatus.EXPIRED) {
      throw new SigningSessionExpiredError(session.id);
    }

    if (
      session.currentStatus === SigningSessionStatus.SIGNED ||
      session.currentStatus === SigningSessionStatus.VOIDED
    ) {
      throw new SigningSessionUnavailableError(session.id, session.currentStatus);
    }

    return session;
  }

  private async expireSessionIfNeeded(
    session: SigningSession,
    now: Date,
    tx?: PrismaTransactionClient,
  ): Promise<boolean> {
    if (session.expiresAt.getTime() > now.getTime()) {
      return false;
    }

    if (
      session.currentStatus === SigningSessionStatus.PENDING ||
      session.currentStatus === SigningSessionStatus.OPENED
    ) {
      this.signingAuditAppender.append(session, SigningAuditEventType.SESSION_EXPIRED, {
        expiredAt: now.toISOString(),
        previousStatus: session.currentStatus,
      });

      const expireResult = session.expire(now);
      if (expireResult.isErr()) {
        throw expireResult.error;
      }

      await this.signingSessionRepository.save(session, tx);
    }

    return true;
  }
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
