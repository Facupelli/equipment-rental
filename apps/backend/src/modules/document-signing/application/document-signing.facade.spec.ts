import { createHash } from 'crypto';

import { ConfigService } from '@nestjs/config';

import { SigningArtifactKind, SigningAuditEventType, SigningDocumentType, SigningSessionStatus } from 'src/generated/prisma/client';
import { ObjectStoragePort } from 'src/modules/object-storage/application/ports/object-storage.port';

import { SigningSession } from '../domain/entities/signing-session.entity';
import { DocumentSigningFacade } from './document-signing.facade';
import { SigningSessionRepository } from '../infrastructure/persistence/repositories/signing-session.repository';

describe('DocumentSigningFacade', () => {
  function makeInput(pdfBytes = Buffer.from('unsigned-contract-pdf')) {
    return {
      tenantId: 'tenant-1',
      orderId: 'order-1',
      customerId: 'customer-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
      recipientEmail: 'customer@example.com',
      rawToken: 'raw-token',
      expiresAt: new Date('2026-05-01T12:00:00.000Z'),
      documentNumber: 'Tenant-0001',
      fileName: 'remito-customer-0001',
      pdfBytes,
    };
  }

  function makeActiveSession(unsignedDocumentHash: string): SigningSession {
    return SigningSession.create({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      customerId: 'customer-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
      recipientEmail: 'customer@example.com',
      unsignedDocumentHash,
      tokenHash: hashString('existing-token'),
      expiresAt: new Date('2026-05-01T12:00:00.000Z'),
    });
  }

  function makeFacade(activeSession: SigningSession | null = null) {
    const savedSessions: SigningSession[] = [];
    const signingSessionRepository = {
      loadActiveByOrderDocumentType: jest.fn(async () => activeSession),
      save: jest.fn(async (session: SigningSession) => {
        savedSessions.push(session);
        return session.id;
      }),
    } as unknown as SigningSessionRepository;

    const objectStorage = {
      putObject: jest.fn(async () => undefined),
    } as unknown as ObjectStoragePort;

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'R2_BUCKET_NAME') {
          return 'contracts-bucket';
        }

        throw new Error(`Unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;

    return {
      facade: new DocumentSigningFacade(signingSessionRepository, objectStorage, configService),
      signingSessionRepository,
      objectStorage,
      savedSessions,
    };
  }

  it('creates the first frozen unsigned artifact and seeds audit events', async () => {
    const input = makeInput();
    const { facade, objectStorage, savedSessions } = makeFacade();

    const result = await facade.prepareSigningSession(input);

    expect(result.reusedExistingSession).toBe(false);
    expect(savedSessions).toHaveLength(1);
    expect(result.sessionId).toBe(savedSessions[0].id);
    expect(savedSessions[0].currentStatus).toBe(SigningSessionStatus.PENDING);
    expect(savedSessions[0].currentUnsignedDocumentHash).toBe(hashBuffer(input.pdfBytes));
    expect(savedSessions[0].getArtifacts()).toHaveLength(1);
    expect(savedSessions[0].getArtifacts()[0].kind).toBe(SigningArtifactKind.UNSIGNED_PDF);
    expect(savedSessions[0].getArtifacts()[0].storage.sha256).toBe(hashBuffer(input.pdfBytes));
    expect(savedSessions[0].getAuditEvents().map((event) => event.type)).toEqual([
      SigningAuditEventType.SESSION_CREATED,
      SigningAuditEventType.ARTIFACT_RECORDED,
    ]);
    expect((objectStorage.putObject as jest.Mock).mock.calls[0][0]).toMatchObject({
      contentType: 'application/pdf',
      body: input.pdfBytes,
    });
    expect((objectStorage.putObject as jest.Mock).mock.calls[0][0].key).toContain(`${result.sessionId}/unsigned/`);
  });

  it('reuses the active session and artifact when the rendered hash matches', async () => {
    const input = makeInput();
    const activeSession = makeActiveSession(hashBuffer(input.pdfBytes));
    const { facade, objectStorage, signingSessionRepository, savedSessions } = makeFacade(activeSession);

    const result = await facade.prepareSigningSession(input);

    expect(result).toEqual({
      sessionId: activeSession.id,
      unsignedDocumentHash: hashBuffer(input.pdfBytes),
      reusedExistingSession: true,
    });
    expect(savedSessions).toHaveLength(0);
    expect((signingSessionRepository.loadActiveByOrderDocumentType as jest.Mock).mock.calls).toHaveLength(1);
    expect((objectStorage.putObject as jest.Mock).mock.calls).toHaveLength(0);
  });

  it('voids the active session and creates a new frozen artifact when the rendered hash changes', async () => {
    const activeSession = makeActiveSession(hashBuffer(Buffer.from('old-pdf')));
    const input = makeInput(Buffer.from('new-pdf'));
    const { facade, savedSessions } = makeFacade(activeSession);

    const result = await facade.prepareSigningSession(input);

    expect(result.reusedExistingSession).toBe(false);
    expect(savedSessions).toHaveLength(2);
    expect(savedSessions[0].id).toBe(activeSession.id);
    expect(savedSessions[0].currentStatus).toBe(SigningSessionStatus.VOIDED);
    const previousSessionAuditEvents = savedSessions[0].getAuditEvents();
    expect(previousSessionAuditEvents[previousSessionAuditEvents.length - 1]?.type).toBe(
      SigningAuditEventType.SESSION_VOIDED,
    );
    expect(savedSessions[1].id).not.toBe(activeSession.id);
    expect(savedSessions[1].currentStatus).toBe(SigningSessionStatus.PENDING);
    expect(savedSessions[1].currentUnsignedDocumentHash).toBe(hashBuffer(input.pdfBytes));
  });
});

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
