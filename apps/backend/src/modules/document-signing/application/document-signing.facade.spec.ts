import { createHash } from 'crypto';
import { Readable } from 'stream';

import { QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { err, ok } from 'neverthrow';
import { OrderStatus } from '@repo/types';

import {
  SigningArtifactKind,
  SigningAuditEventType,
  SigningDocumentType,
  SigningSessionStatus,
} from 'src/generated/prisma/client';
import { NotificationOrchestrator } from 'src/modules/notifications/application/notification-orchestrator.service';
import { NotificationChannel } from 'src/modules/notifications/domain/notification-channel.enum';
import { ObjectStoragePort } from 'src/modules/object-storage/application/ports/object-storage.port';
import { OrderSigningAllowedOnlyForConfirmedOrdersError } from 'src/modules/order/domain/errors/order.errors';
import { PrepareOrderAgreementForSigningQuery } from 'src/modules/order/public/queries/prepare-order-agreement-for-signing.query';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';

import { SigningSession } from '../domain/entities/signing-session.entity';
import { SigningSessionRepository } from '../infrastructure/persistence/repositories/signing-session.repository';
import { DocumentSigningFacade } from './document-signing.facade';

describe('DocumentSigningFacade', () => {
  function makePreparedOrder(pdfBytes = Buffer.from('unsigned-contract-pdf')) {
    return ok({
      orderId: 'order-1',
      customerId: 'customer-1',
      customerEmail: 'customer@example.com',
      buffer: pdfBytes,
      documentNumber: 'Tenant-0001',
      fileName: 'remito-customer-0001',
    });
  }

  function makeActiveSession(
    unsignedDocumentHash: string,
    expiresAt = new Date('2026-05-01T12:00:00.000Z'),
  ): SigningSession {
    return SigningSession.create({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      customerId: 'customer-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
      recipientEmail: 'customer@example.com',
      unsignedDocumentHash,
      tokenHash: hashString('existing-token'),
      expiresAt,
    });
  }

  function cloneSession(session: SigningSession): SigningSession {
    return SigningSession.reconstitute({
      id: session.id,
      tenantId: session.tenantId,
      orderId: session.orderId,
      customerId: session.customerId,
      documentType: session.documentType,
      recipientEmail: session.currentRecipientEmail,
      unsignedDocumentHash: session.currentUnsignedDocumentHash,
      tokenHash: session.currentTokenHash,
      status: session.currentStatus,
      expiresAt: session.expiresAt,
      openedAt: session.openedOn,
      signedAt: session.signedOn,
      declaredFullName: session.currentDeclaredFullName,
      declaredDocumentNumber: session.currentDeclaredDocumentNumber,
      acceptanceTextVersion: session.currentAcceptanceTextVersion,
      agreementHash: session.currentAgreementHash,
      finalCopyTokenHash: session.currentFinalCopyTokenHash,
      finalCopyExpiresAt: session.currentFinalCopyExpiresAt,
      finalCopyUsedAt: session.currentFinalCopyUsedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedOn,
      artifacts: session.getArtifacts(),
      auditEvents: session.getAuditEvents(),
    });
  }

  function makeFacade(options?: {
    activeSession?: SigningSession | null;
    preparedOrderResult?: ReturnType<typeof makePreparedOrder>;
    notificationDispatchResult?: Awaited<ReturnType<NotificationOrchestrator['dispatch']>>;
    notificationDispatchResults?: Array<Awaited<ReturnType<NotificationOrchestrator['dispatch']>>>;
  }) {
    const savedSessions: SigningSession[] = [];
    const activeSession = options?.activeSession ?? null;
    const storedSessions = new Map<string, SigningSession>();

    if (activeSession) {
      storedSessions.set(activeSession.id, cloneSession(activeSession));
    }

    const loadCurrentActiveSession = () => {
      const currentActiveSession = [...storedSessions.values()]
        .filter(
          (session) =>
            session.tenantId === 'tenant-1' &&
            session.orderId === 'order-1' &&
            session.documentType === SigningDocumentType.RENTAL_AGREEMENT &&
            ![SigningSessionStatus.SIGNED, SigningSessionStatus.EXPIRED, SigningSessionStatus.VOIDED].includes(
              session.currentStatus,
            ),
        )
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

      return currentActiveSession ? cloneSession(currentActiveSession) : null;
    };

    const signingSessionRepository = {
      runWithActiveSessionLock: jest.fn(
        async (
          _tenantId: string,
          _orderId: string,
          _documentType: SigningDocumentType,
          work: (tx: unknown) => Promise<unknown>,
        ) => work({} as never),
      ),
      loadActiveByOrderDocumentType: jest.fn(async () => loadCurrentActiveSession()),
      load: jest.fn(async (id: string) => {
        const session = storedSessions.get(id);
        return session ? cloneSession(session) : null;
      }),
      loadByTokenHash: jest.fn(async (tokenHash: string) => {
        const session = [...storedSessions.values()].find((candidate) => candidate.currentTokenHash === tokenHash);
        return session ? cloneSession(session) : null;
      }),
      loadByFinalCopyTokenHash: jest.fn(async (tokenHash: string) => {
        const session = [...storedSessions.values()].find(
          (candidate) => candidate.currentFinalCopyTokenHash === tokenHash,
        );
        return session ? cloneSession(session) : null;
      }),
      save: jest.fn(async (session: SigningSession) => {
        const persisted = cloneSession(session);
        savedSessions.push(persisted);
        storedSessions.set(session.id, persisted);
        return session.id;
      }),
    } as unknown as SigningSessionRepository;

    const objectStorage = {
      putObject: jest.fn(async () => undefined),
      getObjectStream: jest.fn(async () => Readable.from([Buffer.from('unsigned-contract-pdf')])),
    } as unknown as ObjectStoragePort;

    const notificationOrchestrator = {
      dispatch: jest.fn(async () => {
        const nextResult = options?.notificationDispatchResults?.shift();

        return (
          nextResult ??
          options?.notificationDispatchResult ?? {
            attemptedChannels: [NotificationChannel.EMAIL],
            deliveredChannels: [NotificationChannel.EMAIL],
            skippedChannels: [],
            failedChannels: [],
          }
        );
      }),
    } as unknown as NotificationOrchestrator;

    const queryBus = {
      execute: jest.fn(async (query: unknown) => {
        if (query instanceof PrepareOrderAgreementForSigningQuery) {
          return options?.preparedOrderResult ?? makePreparedOrder();
        }

        if (query instanceof FindTenantByIdQuery) {
          return {
            id: 'tenant-1',
            slug: 'tenant-one',
            name: 'Tenant One',
            customDomain: null,
            logoUrl: null,
            faviconUrl: null,
            primaryColor: null,
          };
        }

        throw new Error(`Unexpected query: ${query?.constructor?.name ?? 'unknown'}`);
      }),
    } as unknown as QueryBus;

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'R2_BUCKET_NAME') {
          return 'contracts-bucket';
        }

        if (key === 'ROOT_DOMAIN') {
          return 'example.com';
        }

        if (key === 'DOCUMENT_SIGNING_SESSION_TTL_SECONDS') {
          return 3600;
        }

        throw new Error(`Unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;

    return {
      facade: new DocumentSigningFacade(
        signingSessionRepository,
        objectStorage,
        notificationOrchestrator,
        queryBus,
        configService,
      ),
      signingSessionRepository,
      objectStorage,
      notificationOrchestrator,
      queryBus,
      savedSessions,
    };
  }

  async function issueInvitation(
    facade: DocumentSigningFacade,
    notificationOrchestrator: NotificationOrchestrator,
    recipientEmail?: string,
  ) {
    const result = await facade.sendSigningInvitation({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
      recipientEmail,
    });

    expect(result.isOk()).toBe(true);

    const dispatch = (notificationOrchestrator.dispatch as jest.Mock).mock.calls[0][0];
    const rawToken = new URL(dispatch.payload.signingUrl).searchParams.get('token');

    if (!rawToken) {
      throw new Error('Expected signing invitation token in notification payload.');
    }

    return {
      result: result._unsafeUnwrap(),
      rawToken,
    };
  }

  it('returns an error when invitation issuance is attempted for a non-confirmed order', async () => {
    const { facade, notificationOrchestrator, savedSessions } = makeFacade({
      preparedOrderResult: err(new OrderSigningAllowedOnlyForConfirmedOrdersError('order-1', OrderStatus.ACTIVE)),
    });

    const result = await facade.sendSigningInvitation({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
    });

    expect(result.isErr()).toBe(true);
    expect(savedSessions).toHaveLength(0);
    expect((notificationOrchestrator.dispatch as jest.Mock).mock.calls).toHaveLength(0);
  });

  it('creates a signing invitation session and records email evidence', async () => {
    const preparedOrder = makePreparedOrder()._unsafeUnwrap();
    const { facade, notificationOrchestrator, savedSessions, objectStorage } = makeFacade();
    const before = new Date();

    const result = await facade.sendSigningInvitation({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
    });
    const after = new Date();

    expect(result.isOk()).toBe(true);
    expect(savedSessions).toHaveLength(2);
    expect(savedSessions[1].currentStatus).toBe(SigningSessionStatus.PENDING);
    expect(savedSessions[1].getArtifacts()).toHaveLength(1);
    expect(savedSessions[1].getArtifacts()[0].kind).toBe(SigningArtifactKind.UNSIGNED_PDF);
    expect(savedSessions[1].getArtifacts()[0].documentNumber).toBe(preparedOrder.documentNumber);
    expect(savedSessions[1].getArtifacts()[0].displayFileName).toBe(`${preparedOrder.fileName}.pdf`);
    expect(savedSessions[1].getArtifacts()[0].storage.sha256).toBe(hashBuffer(preparedOrder.buffer));
    expect(savedSessions[1].expiresAt.getTime()).toBeGreaterThanOrEqual(before.getTime() + 3600 * 1000);
    expect(savedSessions[1].expiresAt.getTime()).toBeLessThanOrEqual(after.getTime() + 3600 * 1000);
    expect(savedSessions[1].getAuditEvents().map((event) => event.type)).toEqual([
      SigningAuditEventType.SESSION_CREATED,
      SigningAuditEventType.ARTIFACT_RECORDED,
      SigningAuditEventType.INVITATION_EMAIL_REQUESTED,
      SigningAuditEventType.INVITATION_EMAIL_SENT,
    ]);
    const invitationDispatch = (notificationOrchestrator.dispatch as jest.Mock).mock.calls[0][0];
    expect(new URL(invitationDispatch.payload.signingUrl).searchParams.get('token')).toEqual(expect.any(String));
    expect(invitationDispatch.payload.expiresAt).toEqual(result._unsafeUnwrap().expiresAt);
    expect((notificationOrchestrator.dispatch as jest.Mock).mock.calls[0][0].notificationType).toBe(
      'DOCUMENT_SIGNING_INVITATION',
    );
    expect((objectStorage.putObject as jest.Mock).mock.calls[0][0]).toMatchObject({
      contentType: 'application/pdf',
      body: preparedOrder.buffer,
    });
    expect((objectStorage.putObject as jest.Mock).mock.calls[0][0].key).toContain(
      `${result._unsafeUnwrap().sessionId}/unsigned/`,
    );
  });

  it('returns a public signing read model for the exact frozen unsigned artifact', async () => {
    const preparedOrder = makePreparedOrder()._unsafeUnwrap();
    const { facade, notificationOrchestrator } = makeFacade();

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    const session = await facade.getPublicSigningSession(invitation.rawToken);

    expect(session.sessionId).toBe(invitation.result.sessionId);
    expect(session.document.documentNumber).toBe(preparedOrder.documentNumber);
    expect(session.document.displayFileName).toBe(`${preparedOrder.fileName}.pdf`);
    expect(session.document.sha256).toBe(hashBuffer(preparedOrder.buffer));
    expect(session.status).toBe(SigningSessionStatus.PENDING);
  });

  it('streams the frozen unsigned artifact and records document presentation evidence', async () => {
    const preparedOrder = makePreparedOrder()._unsafeUnwrap();
    const { facade, objectStorage, signingSessionRepository, notificationOrchestrator } = makeFacade();

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    const streamed = await facade.streamPublicUnsignedDocument(invitation.rawToken);
    const session = await (signingSessionRepository.load as jest.Mock)(invitation.result.sessionId);

    expect(streamed.fileName).toBe(`${preparedOrder.fileName}.pdf`);
    expect(streamed.contentType).toBe('application/pdf');
    expect((objectStorage.getObjectStream as jest.Mock).mock.calls[0][0]).toEqual({
      key: expect.stringContaining(`${invitation.result.sessionId}/unsigned/`),
    });
    expect(session.currentStatus).toBe(SigningSessionStatus.OPENED);
    expect(
      session
        .getAuditEvents()
        .slice(-2)
        .map((event) => event.type),
    ).toEqual([SigningAuditEventType.SESSION_OPENED, SigningAuditEventType.DOCUMENT_PRESENTED]);
  });

  it('reuses a valid session, rotates the token hash, and records resend evidence', async () => {
    const activeSession = makeActiveSession(hashBuffer(Buffer.from('unsigned-contract-pdf')));
    const originalTokenHash = activeSession.currentTokenHash;
    const { facade, savedSessions } = makeFacade({ activeSession });

    const result = await facade.sendSigningInvitation({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
      recipientEmail: 'updated@example.com',
    });

    expect(result.isOk()).toBe(true);
    expect(savedSessions).toHaveLength(2);
    expect(savedSessions[1].currentTokenHash).not.toBe(originalTokenHash);
    expect(savedSessions[1].currentRecipientEmail).toBe('updated@example.com');
    expect(savedSessions[1].getAuditEvents().map((event) => event.type)).toEqual([
      SigningAuditEventType.INVITATION_EMAIL_REQUESTED,
      SigningAuditEventType.INVITATION_EMAIL_SENT,
    ]);
  });

  it('captures declared identity, hashes the agreement proof, and seals the acceptance audit chain', async () => {
    const { facade, signingSessionRepository, notificationOrchestrator } = makeFacade();

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    await facade.streamPublicUnsignedDocument(invitation.rawToken);
    const result = await facade.acceptPublicSigningSession({
      rawToken: invitation.rawToken,
      declaredFullName: 'Jane Doe',
      declaredDocumentNumber: '12345678',
      acceptanceTextVersion: 'rental-agreement-v1',
      accepted: true,
    });
    const session = await (signingSessionRepository.load as jest.Mock)(invitation.result.sessionId);

    expect(result.isOk()).toBe(true);
    expect(session.currentStatus).toBe(SigningSessionStatus.SIGNED);
    expect(session.currentDeclaredFullName).toBe('Jane Doe');
    expect(session.currentDeclaredDocumentNumber).toBe('12345678');
    expect(session.currentAcceptanceTextVersion).toBe('rental-agreement-v1');
    expect(session.currentAgreementHash).toBe(result._unsafeUnwrap().agreementHash);
    expect(result._unsafeUnwrap().finalCopyDelivery).toEqual({
      status: 'SENT',
      failureReason: null,
      failureMessage: null,
    });
    expect(session.currentFinalCopyTokenHash).not.toBeNull();
    expect(session.currentFinalCopyExpiresAt).not.toBeNull();
    expect(session.getArtifacts().map((artifact) => artifact.kind)).toEqual([
      SigningArtifactKind.UNSIGNED_PDF,
      SigningArtifactKind.SIGNED_PDF,
    ]);
    expect(
      session
        .getAuditEvents()
        .slice(-8)
        .map((event) => event.type),
    ).toEqual([
      SigningAuditEventType.IDENTITY_DECLARED,
      SigningAuditEventType.ACCEPTANCE_CONFIRMED,
      SigningAuditEventType.AGREEMENT_HASH_CREATED,
      SigningAuditEventType.SESSION_SIGNED,
      'SIGNED_PDF_GENERATED',
      'SIGNED_PDF_STORED',
      'FINAL_COPY_EMAIL_REQUESTED',
      'FINAL_COPY_EMAIL_SENT',
    ]);

    const chainedEvents = session.getAuditEvents().slice(-8);
    expect(chainedEvents[0].previousHash).toBe(
      session.getAuditEvents()[session.getAuditEvents().length - 9]?.currentHash ?? null,
    );
    expect(chainedEvents[1].previousHash).toBe(chainedEvents[0].currentHash);
    expect(chainedEvents[2].previousHash).toBe(chainedEvents[1].currentHash);
    expect(chainedEvents[3].previousHash).toBe(chainedEvents[2].currentHash);
    expect(chainedEvents[4].previousHash).toBe(chainedEvents[3].currentHash);
    expect(chainedEvents[5].previousHash).toBe(chainedEvents[4].currentHash);
    expect(chainedEvents[6].previousHash).toBe(chainedEvents[5].currentHash);
    expect(chainedEvents[7].previousHash).toBe(chainedEvents[6].currentHash);
  });

  it('derives the final signed artifact from the frozen unsigned bytes without live re-rendering', async () => {
    const preparedOrderResult = makePreparedOrder(Buffer.from('frozen-unsigned-pdf'));
    const preparedOrder = preparedOrderResult._unsafeUnwrap();
    const { facade, objectStorage, queryBus, notificationOrchestrator } = makeFacade({ preparedOrderResult });

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    await facade.streamPublicUnsignedDocument(invitation.rawToken);
    await facade.acceptPublicSigningSession({
      rawToken: invitation.rawToken,
      declaredFullName: 'Jane Doe',
      declaredDocumentNumber: '12345678',
      acceptanceTextVersion: 'rental-agreement-v1',
      accepted: true,
    });

    expect((objectStorage.putObject as jest.Mock).mock.calls).toHaveLength(2);
    expect((objectStorage.putObject as jest.Mock).mock.calls[1][0]).toMatchObject({
      body: preparedOrder.buffer,
      metadata: expect.objectContaining({
        unsignedDocumentHash: hashBuffer(preparedOrder.buffer),
      }),
    });
    expect((objectStorage.putObject as jest.Mock).mock.calls[1][0].metadata.sha256).toBe(
      hashBuffer(preparedOrder.buffer),
    );
    expect((objectStorage.putObject as jest.Mock).mock.calls[1][0].key).toContain('/signed/');
    expect(
      (queryBus.execute as jest.Mock).mock.calls.some(
        ([query]) => query?.constructor?.name === 'PrepareSignedOrderAgreementQuery',
      ),
    ).toBe(false);
  });

  it('streams the final signed artifact through a one-time token', async () => {
    const { facade, objectStorage, notificationOrchestrator } = makeFacade();

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    await facade.streamPublicUnsignedDocument(invitation.rawToken);
    await facade.acceptPublicSigningSession({
      rawToken: invitation.rawToken,
      declaredFullName: 'Jane Doe',
      declaredDocumentNumber: '12345678',
      acceptanceTextVersion: 'rental-agreement-v1',
      accepted: true,
    });

    const finalCopyDispatch = (notificationOrchestrator.dispatch as jest.Mock).mock.calls[1][0];
    const token = new URL(finalCopyDispatch.payload.downloadUrl).searchParams.get('token');

    const streamed = await facade.streamFinalSignedCopy(token ?? '');

    expect((objectStorage.putObject as jest.Mock).mock.calls).toHaveLength(2);
    expect((objectStorage.putObject as jest.Mock).mock.calls[1][0].key).toContain('/signed/');
    expect(streamed.fileName).toBe('remito-customer-0001-signed.pdf');
    expect((objectStorage.getObjectStream as jest.Mock).mock.calls[1][0].key).toContain('/signed/');
    await expect(facade.streamFinalSignedCopy(token ?? '')).rejects.toThrow();
  });

  it('records final-copy email failure evidence without rolling back acceptance', async () => {
    const { facade, signingSessionRepository, notificationOrchestrator } = makeFacade({
      notificationDispatchResults: [
        {
          attemptedChannels: [NotificationChannel.EMAIL],
          deliveredChannels: [NotificationChannel.EMAIL],
          skippedChannels: [],
          failedChannels: [],
        },
        {
          attemptedChannels: [NotificationChannel.EMAIL],
          deliveredChannels: [],
          skippedChannels: [],
          failedChannels: [
            {
              channel: NotificationChannel.EMAIL,
              reason: 'PROVIDER_ERROR',
              message: 'Provider rejected the email.',
            },
          ],
        },
      ],
    });

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    await facade.streamPublicUnsignedDocument(invitation.rawToken);
    const result = await facade.acceptPublicSigningSession({
      rawToken: invitation.rawToken,
      declaredFullName: 'Jane Doe',
      declaredDocumentNumber: '12345678',
      acceptanceTextVersion: 'rental-agreement-v1',
      accepted: true,
    });
    const session = await (signingSessionRepository.load as jest.Mock)(invitation.result.sessionId);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().finalCopyDelivery).toEqual({
      status: 'FAILED',
      failureReason: 'PROVIDER_ERROR',
      failureMessage: 'Provider rejected the email.',
    });
    expect(session.currentStatus).toBe(SigningSessionStatus.SIGNED);
    expect(session.getAuditEvents()[session.getAuditEvents().length - 1]?.type).toBe('FINAL_COPY_EMAIL_FAILED');
  });

  it('does not persist a signed session when signed artifact storage fails', async () => {
    const { facade, objectStorage, signingSessionRepository, notificationOrchestrator } = makeFacade();

    (objectStorage.putObject as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('signed artifact storage failed'));

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    await facade.streamPublicUnsignedDocument(invitation.rawToken);

    await expect(
      facade.acceptPublicSigningSession({
        rawToken: invitation.rawToken,
        declaredFullName: 'Jane Doe',
        declaredDocumentNumber: '12345678',
        acceptanceTextVersion: 'rental-agreement-v1',
        accepted: true,
      }),
    ).rejects.toThrow('signed artifact storage failed');

    const session = await (signingSessionRepository.load as jest.Mock)(invitation.result.sessionId);

    expect(session.currentStatus).toBe(SigningSessionStatus.OPENED);
    expect(session.currentAgreementHash).toBeNull();
    expect(session.currentFinalCopyTokenHash).toBeNull();
    expect(session.getArtifacts().map((artifact) => artifact.kind)).toEqual([SigningArtifactKind.UNSIGNED_PDF]);
    expect(session.getAuditEvents().map((event) => event.type)).not.toContain(SigningAuditEventType.SESSION_SIGNED);
  });

  it('rejects acceptance before the unsigned document is presented', async () => {
    const { facade, notificationOrchestrator } = makeFacade();

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    const result = await facade.acceptPublicSigningSession({
      rawToken: invitation.rawToken,
      declaredFullName: 'Jane Doe',
      declaredDocumentNumber: '12345678',
      acceptanceTextVersion: 'rental-agreement-v1',
      accepted: true,
    });

    expect(result.isErr()).toBe(true);
  });

  it('rejects acceptance when explicit confirmation is false', async () => {
    const { facade, notificationOrchestrator } = makeFacade();

    const invitation = await issueInvitation(facade, notificationOrchestrator);
    await facade.streamPublicUnsignedDocument(invitation.rawToken);
    const result = await facade.acceptPublicSigningSession({
      rawToken: invitation.rawToken,
      declaredFullName: 'Jane Doe',
      declaredDocumentNumber: '12345678',
      acceptanceTextVersion: 'rental-agreement-v1',
      accepted: false,
    });

    expect(result.isErr()).toBe(true);
  });

  it('records invitation failure evidence and returns an error when email delivery fails', async () => {
    const { facade, savedSessions } = makeFacade({
      notificationDispatchResult: {
        attemptedChannels: [NotificationChannel.EMAIL],
        deliveredChannels: [],
        skippedChannels: [],
        failedChannels: [
          {
            channel: NotificationChannel.EMAIL,
            reason: 'PROVIDER_ERROR',
            message: 'Provider rejected the email.',
          },
        ],
      },
    });

    const result = await facade.sendSigningInvitation({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      documentType: SigningDocumentType.RENTAL_AGREEMENT,
    });

    expect(result.isErr()).toBe(true);
    expect(savedSessions).toHaveLength(2);
    expect(savedSessions[1].getAuditEvents().map((event) => event.type)).toEqual([
      SigningAuditEventType.SESSION_CREATED,
      SigningAuditEventType.ARTIFACT_RECORDED,
      SigningAuditEventType.INVITATION_EMAIL_REQUESTED,
      SigningAuditEventType.INVITATION_EMAIL_FAILED,
    ]);
  });
});

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
