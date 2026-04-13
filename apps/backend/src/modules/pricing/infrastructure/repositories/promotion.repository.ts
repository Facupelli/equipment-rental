import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { Promotion } from '../../domain/entities/promotion.entity';
import { PromotionMapper } from '../persistence/mappers/promotion.mapper';

@Injectable()
export class PromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Promotion | null> {
    const raw = await this.prisma.client.promotion.findUnique({
      where: { id },
      include: { exclusions: true },
    });

    return raw ? PromotionMapper.toDomain(raw) : null;
  }

  async save(promotion: Promotion, tx?: PrismaTransactionClient): Promise<string> {
    const client = tx ?? this.prisma.client;
    const row = PromotionMapper.toPersistence(promotion);

    await client.promotion.upsert({
      where: { id: promotion.id },
      create: row,
      update: row,
    });

    await client.promotionExclusion.deleteMany({
      where: { promotionId: promotion.id },
    });

    const exclusions = PromotionMapper.toExclusionRows(promotion);
    if (exclusions.length > 0) {
      await client.promotionExclusion.createMany({
        data: exclusions,
      });
    }

    return promotion.id;
  }

  async delete(id: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx ?? this.prisma.client;

    await client.promotionExclusion.deleteMany({
      where: { promotionId: id },
    });

    await client.promotion.delete({
      where: { id },
    });
  }
}
