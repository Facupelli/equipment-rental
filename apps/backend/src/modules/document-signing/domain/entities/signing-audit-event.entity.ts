import { randomUUID } from 'crypto';

import { SigningAuditEventType } from 'src/generated/prisma/client';

export type SigningAuditPayload =
  | null
  | boolean
  | number
  | string
  | SigningAuditPayload[]
  | { [key: string]: SigningAuditPayload };

export interface CreateSigningAuditEventProps {
  sessionId: string;
  sequence: number;
  type: SigningAuditEventType;
  payload: SigningAuditPayload;
  occurredAt: Date;
  previousHash: string | null;
  currentHash: string;
}

export interface ReconstituteSigningAuditEventProps extends CreateSigningAuditEventProps {
  id: string;
}

export class SigningAuditEvent {
  private constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly sequence: number,
    public readonly type: SigningAuditEventType,
    public readonly payload: SigningAuditPayload,
    public readonly occurredAt: Date,
    public readonly previousHash: string | null,
    public readonly currentHash: string,
  ) {}

  static create(props: CreateSigningAuditEventProps): SigningAuditEvent {
    return new SigningAuditEvent(
      randomUUID(),
      props.sessionId,
      props.sequence,
      props.type,
      props.payload,
      props.occurredAt,
      props.previousHash,
      props.currentHash,
    );
  }

  static reconstitute(props: ReconstituteSigningAuditEventProps): SigningAuditEvent {
    return new SigningAuditEvent(
      props.id,
      props.sessionId,
      props.sequence,
      props.type,
      props.payload,
      props.occurredAt,
      props.previousHash,
      props.currentHash,
    );
  }
}
