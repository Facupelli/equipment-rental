import { Injectable } from '@nestjs/common';
import { InvitationMapper } from '../mappers/invitation.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { InvitationRepositoryPort } from 'src/modules/users/domain/ports/invitation.repository.port';
import { Invitation } from 'src/modules/users/domain/entities/invitation.entity';

@Injectable()
export class InvitationRepository implements InvitationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Invitation | null> {
    const raw = await this.prisma.client.invitation.findUnique({ where: { id } });
    if (!raw) return null;
    return InvitationMapper.toDomain(raw);
  }

  async save(invitation: Invitation): Promise<string> {
    const data = InvitationMapper.toPersistence(invitation);
    await this.prisma.client.invitation.upsert({
      where: { id: invitation.id },
      create: data,
      update: data,
    });
    return invitation.id;
  }
}
