import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetOwnerQuery } from './get-owner.query';
import { GetOwnerResponseDto } from '@repo/schemas';
import { ContractBasis } from '@repo/types';

@QueryHandler(GetOwnerQuery)
export class GetOwnerQueryHandler implements IQueryHandler<GetOwnerQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOwnerQuery): Promise<GetOwnerResponseDto> {
    const owner = await this.prisma.client.owner.findUnique({
      where: { id: query.ownerId },
      include: {
        contracts: {
          orderBy: { validFrom: 'desc' },
        },
      },
    });

    if (!owner) {
      throw new NotFoundException(`Owner with id ${query.ownerId} not found`);
    }

    return {
      id: owner.id,
      tenantId: owner.tenantId,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      notes: owner.notes,
      isActive: owner.isActive,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
      contracts: owner.contracts.map((c) => ({
        id: c.id,
        ownerId: c.ownerId,
        assetId: c.assetId,
        ownerShare: c.ownerShare.toNumber(),
        rentalShare: c.rentalShare.toNumber(),
        basis: c.basis as ContractBasis,
        validFrom: c.validFrom,
        validUntil: c.validUntil,
        notes: c.notes,
        isActive: c.isActive,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }
}
