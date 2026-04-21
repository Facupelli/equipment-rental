import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';

import { ExternalIdentity, ExternalIdentityProvider } from '../../domain/entities/external-identity.entity';
import { ExternalIdentityMapper } from '../mappers/external-identity.mapper';

@Injectable()
export class ExternalIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProviderSubject(
    provider: ExternalIdentityProvider,
    providerSubject: string,
  ): Promise<ExternalIdentity | null> {
    const record = await this.prisma.client.externalIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider,
          providerSubject,
        },
      },
    });

    return record ? ExternalIdentityMapper.toDomain(record) : null;
  }

  async save(identity: ExternalIdentity): Promise<void> {
    await this.prisma.client.externalIdentity.upsert({
      where: { id: identity.id },
      create: ExternalIdentityMapper.toPersistence(identity),
      update: ExternalIdentityMapper.toUpdatePersistence(identity),
    });
  }
}
