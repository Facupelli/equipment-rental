import { Invitation } from '../entities/invitation.entity';

export abstract class InvitationRepositoryPort {
  abstract load(id: string): Promise<Invitation | null>;
  abstract save(invitation: Invitation): Promise<string>;
}
