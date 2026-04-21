import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';

import { ExternalIdentity, ExternalIdentityProvider } from '../../domain/entities/external-identity.entity';
import { ExternalIdentityMapper } from '../mappers/external-identity.mapper';

@Injectable()
export class ExternalIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCustomerByProviderSubjectInTenant(
    provider: ExternalIdentityProvider,
    providerSubject: string,
    tenantId: string,
  ): Promise<ExternalIdentity | null> {
    const record = await this.prisma.client.externalIdentity.findFirst({
      where: {
        provider,
        providerSubject,
        tenantId,
        customerId: { not: null },
      },
    } as never);

    return record ? ExternalIdentityMapper.toDomain(record) : null;
  }

  async save(identity: ExternalIdentity): Promise<void> {
    await this.prisma.client.externalIdentity.upsert({
      where: { id: identity.id },
      create: ExternalIdentityMapper.toPersistence(identity),
      update: ExternalIdentityMapper.toUpdatePersistence(identity),
    } as never);
  }
}
