import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';

import { SigningAuditEventType } from 'src/generated/prisma/client';

import { SigningAuditEvent, SigningAuditPayload } from '../domain/entities/signing-audit-event.entity';
import { SigningSession } from '../domain/entities/signing-session.entity';

@Injectable()
export class SigningAuditAppender {
  append(session: SigningSession, type: SigningAuditEventType, payload: SigningAuditPayload): void {
    const auditEvents = session.getAuditEvents();
    const previousHash = auditEvents[auditEvents.length - 1]?.currentHash ?? null;
    const sequence = auditEvents.length + 1;
    const occurredAt = new Date();
    const currentHash = hashString(
      stableStringify({
        sessionId: session.id,
        sequence,
        type,
        occurredAt: occurredAt.toISOString(),
        previousHash,
        payload,
      }),
    );

    const addAuditEventResult = session.addAuditEvent(
      SigningAuditEvent.create({
        sessionId: session.id,
        sequence,
        type,
        payload,
        occurredAt,
        previousHash,
        currentHash,
      }),
    );

    if (addAuditEventResult.isErr()) {
      throw addAuditEventResult.error;
    }
  }
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);

  return `{${entries.join(',')}}`;
}
